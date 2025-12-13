MVP Goal

Build a backend API (Flask) that lets a logged-in user:
Save contacts and groups
Create & schedule SMS campaigns
Send bulk SMS via one provider
Track delivery status & errors
Respect opt-out and simple limits
Allow an admin to manage users, credits, and basic settings

1. Users, Auth & Security (Core)
Features
User registration & login
JWT-based authentication

Basic roles: user, admin

Password reset (via email link or temporary token)

Rate limiting (e.g., per IP / per user on sensitive endpoints)

Minimal Data Model

User

id

email (unique)

password_hash

role (user / admin)

is_active (bool)

created_at

Session / Token (optional)
You can just use stateless JWT; no table needed unless you want refresh tokens / blacklisting.

Key Endpoints

POST /auth/register

POST /auth/login

POST /auth/logout (optional, client-side token discard)

POST /auth/request-reset

POST /auth/reset-password

Middleware / decorator for @jwt_required and @role_required('admin')

2. Contacts & Groups (Core)
Features

Create, update, delete contacts

Store name + phone + notes

Mark contacts as opted out

Create groups (lists) and associate contacts

Import contacts via CSV (can be a “later” subfeature)

Data Model

Contact

id

user_id (owner)

name

phone

email (optional)

is_opted_out (bool, default False)

created_at, updated_at

Group

id

user_id

name

description (optional)

created_at

GroupContact (junction)

group_id

contact_id

Key Endpoints

GET /contacts

POST /contacts

GET /contacts/<id>

PUT /contacts/<id>

DELETE /contacts/<id>

GET /groups

POST /groups

GET /groups/<id>

PUT /groups/<id>

DELETE /groups/<id>

POST /groups/<id>/contacts (add contacts)

DELETE /groups/<id>/contacts/<contact_id> (remove contact)

Optional (but nice):

POST /contacts/import (CSV upload stub; you can just parse file and add)

3. Campaigns & Scheduling (Core)
Features

Create campaign: name, message, target group(s)

Option: send now or schedule for later

Track overall campaign status: draft, scheduled, sending, completed, failed

Data Model

Campaign

id

user_id

name

message (text)

scheduled_for (nullable datetime)

status (draft, scheduled, sending, completed, failed)

total_recipients (int)

created_at, updated_at

Message (per recipient)

id

campaign_id

contact_id (nullable if number passed directly)

phone

body

status (queued, sent, delivered, failed)

provider_message_id (string)

error_code (string, nullable)

error_message (text, nullable)

sent_at

updated_at

Key Endpoints

POST /campaigns

Body: { name, message, group_ids[], scheduled_for? }

Creates campaign + Message records (respecting is_opted_out)

GET /campaigns

GET /campaigns/<id>

POST /campaigns/<id>/send

For “send now” (if not using auto-send when created)

GET /campaigns/<id>/messages

Paginated list of message logs

4. SMS Engine & Provider Integration (Core)
Features

Abstract SMS sending through a provider wrapper

Use a background worker (Celery/RQ) to send SMS in bulk

Simple retry policy on technical failures

Internals

Provider Wrapper (sms_provider.py)

send_single_sms(phone, message) -> {success, provider_message_id, error_code, error_message}

Background Task (tasks.py)

send_campaign_messages(campaign_id):

Set campaign.status = 'sending'

For each queued message:

Call send_single_sms

Update status, sent_at, provider_message_id, error_*

On transient failure: retry X times

When done: set campaign.status = 'completed' (or failed if all failed)

No Public Endpoints (just integration):

Worker runs separately (e.g. celery -A app.celery worker)

5. Delivery Reports & Logs (Core)
Features

Receive delivery receipts (DLR) from provider via webhook

Update message status to delivered / failed

Show status per message and per campaign

Data Model (reuses Message)

status updated based on provider callbacks

updated_at automatically updated

Key Endpoint

POST /webhooks/sms-status (public, unauthenticated but signed/validated)

Body will vary by provider; typical fields: message_id, status, error_code

Lookup Message by provider_message_id

Update status, error_code, error_message

6. Credits & Limits (Lean MVP)
Features

Track SMS credits per user

Subtract credit per message sent (or per successful provider call)

Block campaign send if credits are insufficient

Data Model

User (extend)

credits (integer, default e.g. 0)

CreditTransaction (optional for audit)

id

user_id

amount (+/-)

reason (topup, campaign_send, adjustment)

created_at

Key Endpoints

User-facing:

GET /me/credits

Admin:

POST /admin/users/<id>/credits/topup

Body: { amount, note }

Logic

When creating/sending a campaign, estimate needed SMS count and:

if credits < total_needed: reject with error

else: reserve or deduct credits

7. Admin & RBAC (Lean MVP)
Features

Admin login as normal user but with role = 'admin'

View user list

Adjust credits

View global stats (optional)

Key Endpoints (admin-only, via @role_required('admin'))

GET /admin/users

GET /admin/users/<id>

POST /admin/users/<id>/credits/topup

(Optional) GET /admin/overview for high-level metrics

8. Compliance & Opt-Out (Core Logic)
Features

Opt-out flag in Contact (is_opted_out)

Never send SMS to opted-out contacts

API endpoint to mark opt-out

(Optional) support incoming “STOP” SMS if provider supports inbound webhook

Data & Logic

Already in Contact.is_opted_out

When creating messages for a campaign:

Exclude contacts where is_opted_out = True

Key Endpoints

POST /contacts/<id>/opt-out

(Optional) POST /webhooks/inbound-sms

Parse inbound messages; if text matches "STOP", set is_opted_out = True

9. Ops, Environment & Dev Tools (Minimal)
Features

Config via .env

Per-environment provider keys (DEV vs PROD)

Health check endpoint

Key Items

.env: DB URL, provider API key, sender ID, JWT secret, environment name

Basic logging (to console/file)

Health endpoint:

GET /health

Checks DB connectivity

Optionally checks ability to ping Redis/queue

📌 Priority Breakdown (Build Order)

To keep you focused when coding in Flask:

Phase 1 – Absolutely Core

Users & Auth (/auth/*, User model, JWT)

Contacts & Groups (Contact, Group, GroupContact, CRUD endpoints)

Campaigns & Messages models

SMS provider wrapper + background worker

POST /campaigns, POST /campaigns/<id>/send

DLR webhook (/webhooks/sms-status)

Phase 2 – Still MVP but After Core

Credits system (field on User + topup endpoint)

Opt-out logic & endpoint

Admin endpoints with RBAC

Health check and basic rate limiting

{
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc2NTYwNDY2NywianRpIjoiOWZjZTg2NmMtYzFlYy00YTk0LWI3ZjktNjYwMGNmYTJkNDVjIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6MiwibmJmIjoxNzY1NjA0NjY3LCJjc3JmIjoiZGExMGM0YzUtYjZjOC00NWJhLWI4MzMtYTQ1OGViZWRlZDVjIiwiZXhwIjoxNzY1NjMzNDY3LCJyb2xlIjoidXNlciJ9.JWaAPqnuHDZfHvnmcvzv73RkG8_ecrXAT365pzXYtOw",
    "user": {
        "id": 2,
        "name": "Dan",
        "email": "dan@example.com",
        "role": "user"
    }
}

{
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc2NTYwNzIyMSwianRpIjoiNDhhODNmYTAtOGYyOC00NmViLWE2OTAtZDZlZjA1N2RhMzk1IiwidHlwZSI6ImFjY2VzcyIsInN1YiI6IjEiLCJuYmYiOjE3NjU2MDcyMjEsImNzcmYiOiJiZjY1Njg2ZS1jZjJmLTRhNmYtOTJlYy0yMzQ3YjE1ZjI2Y2MiLCJleHAiOjE3NjU2MzYwMjEsInJvbGUiOiJ1c2VyIn0.bZFYZb3lMeHTv5PnErofKeYjGlyOmH02lK24NePyfdg",
    "user": {
        "id": 1,
        "name": "Kylian",
        "email": "kylian@example.com",
        "role": "user"
    }
}