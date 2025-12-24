resources
File	Purpose
__init__.py	Marks this folder as a Python package. Essential. 
_helpers.py	Shared utilities (e.g., pagination, serialization, token logic, error formatters). Good modularity. 
auth.py	Login, registration, password handling, JWT/token generation. Needed for multi-user. 
client_accounts.py	Create/update/view client businesses (tenants). Admin-facing. 
contacts.py	Create, import, manage contacts (phonebook). 
groups.py	Manage contact groups (segments). Many-to-many logic likely used here. 
campaigns.py	Launch, schedule, and track bulk campaigns. Links to messages. 
messages.py	Raw message tracking, status updates, delivery logs. 
sender_ids.py	Register sender IDs, update status, view history. Needed for Advanta. 
billing.py	Handles invoices, credit topups, transactions, Mpesa/webhook logic. 
api_keys.py	Routes to manage API keys for external system integration. Dev-friendly. 
provider.py	Manage provider configs (e.g., AdvantaSMS endpoint, rotate API keys). 
__pycache__	Python compiles your .py files into .pyc. Ignore this — it’s expected. 