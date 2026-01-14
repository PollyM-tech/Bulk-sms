# models.py
from __future__ import annotations

from datetime import datetime
import secrets

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import MetaData
from sqlalchemy_serializer import SerializerMixin
from werkzeug.security import generate_password_hash, check_password_hash

# -----------------------------
# SQLAlchemy setup (naming convention)
# -----------------------------
naming_convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}
metadata = MetaData(naming_convention=naming_convention)
db = SQLAlchemy(metadata=metadata)


# -----------------------------
# Common mixins
# -----------------------------
class TimestampMixin:
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


# -----------------------------
# Many-to-many: Group <-> Contact
# -----------------------------
group_contacts = db.Table(
    "group_contacts",
    db.Column("group_id", db.Integer, db.ForeignKey("groups.id", ondelete="CASCADE"), primary_key=True),
    db.Column("contact_id", db.Integer, db.ForeignKey("contacts.id", ondelete="CASCADE"), primary_key=True),
)


# -----------------------------
# Provider Config (AdvantaSMS upstream)
# -----------------------------
class ProviderConfig(db.Model, SerializerMixin, TimestampMixin):
    __tablename__ = "provider_configs"

    id = db.Column(db.Integer, primary_key=True)

    provider = db.Column(db.String(50), unique=True, nullable=False, default="advantasms")
    base_url = db.Column(db.String(255), nullable=False, default="https://quicksms.advantasms.com")

    partner_id = db.Column(db.String(60), nullable=True)

    # Keep real API key in .env. This is only a hint for ops/auditing.
    api_key_hint = db.Column(db.String(64))
    api_key_last_rotated_at = db.Column(db.DateTime)

    default_shortcode = db.Column(db.String(20))
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    serialize_rules = ()


# -----------------------------
# PLAN (Starter/Business/Enterprise)
# -----------------------------
class Plan(db.Model, SerializerMixin, TimestampMixin):
    __tablename__ = "plans"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(80), unique=True, nullable=False)
    monthly_fee_kes = db.Column(db.Integer, default=0, nullable=False)

    included_sms_units = db.Column(db.Integer, default=0, nullable=False)
    overage_price_per_sms_kes = db.Column(db.Numeric(10, 2), default=0.0, nullable=False)

    status = db.Column(
        db.Enum("active", "inactive", name="plan_status"),
        default="active",
        nullable=False,
    )

    serialize_rules = ()


# -----------------------------
# CLIENT ACCOUNT (TENANT)
# -----------------------------
class ClientAccount(db.Model, SerializerMixin, TimestampMixin):
    __tablename__ = "client_accounts"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(160), nullable=False)
    primary_email = db.Column(db.String(128))
    phone = db.Column(db.String(30))

    status = db.Column(
        db.Enum("active", "suspended", name="client_account_status"),
        default="active",
        nullable=False,
    )

    timezone = db.Column(db.String(50), default="Africa/Nairobi", nullable=False)

    # Wallet / prepaid credits (SMS units)
    credits_balance = db.Column(db.Integer, default=0, nullable=False)

    cost_price_per_sms_kes = db.Column(db.Numeric(10, 2), default=0.0, nullable=False)
    sell_price_per_sms_kes = db.Column(db.Numeric(10, 2), default=0.0, nullable=False)

    default_shortcode = db.Column(db.String(20))

    # Relationships
    users = db.relationship("User", backref="client_account", lazy=True, cascade="all, delete-orphan", passive_deletes=True)
    api_keys = db.relationship("ApiKey", backref="client_account", lazy=True, cascade="all, delete-orphan", passive_deletes=True)
    sender_ids = db.relationship("SenderID", backref="client_account", lazy=True, cascade="all, delete-orphan", passive_deletes=True)
    contacts = db.relationship("Contact", backref="client_account", lazy=True, cascade="all, delete-orphan", passive_deletes=True)
    groups = db.relationship("Group", backref="client_account", lazy=True, cascade="all, delete-orphan", passive_deletes=True)
    subscriptions = db.relationship("Subscription", backref="client_account", lazy=True, cascade="all, delete-orphan", passive_deletes=True)
    credit_transactions = db.relationship("CreditTransaction", backref="client_account", lazy=True, cascade="all, delete-orphan", passive_deletes=True)
    invoices = db.relationship("Invoice", backref="client_account", lazy=True, cascade="all, delete-orphan", passive_deletes=True)
    payments = db.relationship("Payment", backref="client_account", lazy=True, cascade="all, delete-orphan", passive_deletes=True)
    mpesa_stk_requests = db.relationship("MpesaStkRequest", backref="client_account", lazy=True, cascade="all, delete-orphan", passive_deletes=True)
    campaigns = db.relationship("Campaign", backref="client_account", lazy=True, cascade="all, delete-orphan", passive_deletes=True)
    messages = db.relationship("Message", backref="client_account", lazy=True, cascade="all, delete-orphan", passive_deletes=True)

    serialize_rules = ()


# -----------------------------
# SUBSCRIPTION (ties ClientAccount to Plan)
# -----------------------------
class Subscription(db.Model, SerializerMixin, TimestampMixin):
    __tablename__ = "subscriptions"

    id = db.Column(db.Integer, primary_key=True)

    client_account_id = db.Column(db.Integer, db.ForeignKey("client_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id = db.Column(db.Integer, db.ForeignKey("plans.id", ondelete="RESTRICT"), nullable=False, index=True)

    status = db.Column(
        db.Enum("active", "suspended", "cancelled", name="subscription_status"),
        default="active",
        nullable=False,
    )

    billing_start = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    billing_end = db.Column(db.DateTime, nullable=True)

    # Snapshot fields
    plan_name_snapshot = db.Column(db.String(80))
    monthly_fee_kes_snapshot = db.Column(db.Integer, default=0)
    included_sms_units_snapshot = db.Column(db.Integer, default=0)
    overage_price_per_sms_kes_snapshot = db.Column(db.Numeric(10, 2), default=0.0)

    plan = db.relationship("Plan")

    serialize_rules = ()


# -----------------------------
# USER MODEL
# -----------------------------
class User(db.Model, SerializerMixin, TimestampMixin):
    __tablename__ = "users"

    serialize_rules = ("-password_hash",)

    id = db.Column(db.Integer, primary_key=True)

    client_account_id = db.Column(db.Integer, db.ForeignKey("client_accounts.id", ondelete="SET NULL"), nullable=True, index=True)

    name = db.Column(db.String(100))

    # For multi-tenant email reuse later, remove unique=True and add composite unique
    email = db.Column(db.String(128), unique=True, nullable=False, index=True)

    password_hash = db.Column(db.String(256), nullable=False)

    role = db.Column(
        db.Enum("user", "admin", "superadmin", name="user_roles"),
        default="user",
        nullable=False,
    )

    is_active = db.Column(db.Boolean, default=True, nullable=False)

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)


# -----------------------------
# API KEY (for client systems/softwares)
# -----------------------------
class ApiKey(db.Model, SerializerMixin, TimestampMixin):
    __tablename__ = "api_keys"

    id = db.Column(db.Integer, primary_key=True)

    client_account_id = db.Column(db.Integer, db.ForeignKey("client_accounts.id", ondelete="CASCADE"), nullable=False, index=True)

    name = db.Column(db.String(80), nullable=False)
    key_prefix = db.Column(db.String(12), nullable=False, index=True)
    key_hash = db.Column(db.String(256), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    last_used_at = db.Column(db.DateTime)

    __table_args__ = (
        db.UniqueConstraint("client_account_id", "name", name="uq_apikey_name_per_client"),
    )

    @staticmethod
    def generate_raw_key() -> str:
        return secrets.token_urlsafe(32)

    serialize_rules = ()


# -----------------------------
# SENDER ID MODEL
# -----------------------------
class SenderID(db.Model, SerializerMixin, TimestampMixin):
    __tablename__ = "sender_ids"

    id = db.Column(db.Integer, primary_key=True)

    client_account_id = db.Column(db.Integer, db.ForeignKey("client_accounts.id", ondelete="CASCADE"), nullable=False, index=True)

    sender_id = db.Column(db.String(15), nullable=False)

    purpose = db.Column(
        db.Enum("transactional", "promotional", "otp", name="sender_id_purpose"),
        default="transactional",
        nullable=False,
    )

    status = db.Column(
        db.Enum("pending", "approved", "rejected", name="sender_id_status"),
        default="pending",
        nullable=False,
    )

    safaricom_status = db.Column(db.Enum("pending", "approved", "rejected", name="sid_safaricom_status"), default="pending", nullable=False)
    airtel_status = db.Column(db.Enum("pending", "approved", "rejected", name="sid_airtel_status"), default="pending", nullable=False)
    telkom_status = db.Column(db.Enum("pending", "approved", "rejected", name="sid_telkom_status"), default="pending", nullable=False)

    network_setup_fee_kes = db.Column(db.Integer, default=6000, nullable=False)

    requested_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    approved_at = db.Column(db.DateTime, nullable=True)

    __table_args__ = (
        db.UniqueConstraint("client_account_id", "sender_id", name="uq_senderid_per_client"),
        db.Index("ix_sender_ids_client_status", "client_account_id", "status"),
    )

    serialize_rules = ()


# -----------------------------
# CONTACT MODEL
# -----------------------------
class Contact(db.Model, SerializerMixin, TimestampMixin):
    __tablename__ = "contacts"

    id = db.Column(db.Integer, primary_key=True)

    client_account_id = db.Column(db.Integer, db.ForeignKey("client_accounts.id", ondelete="CASCADE"), nullable=False, index=True)

    created_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    created_by = db.relationship("User", foreign_keys=[created_by_user_id])

    name = db.Column(db.String(100))
    phone = db.Column(db.String(20), nullable=False)
    phone_e164 = db.Column(db.String(20), index=True)

    email = db.Column(db.String(128))
    is_opted_out = db.Column(db.Boolean, default=False, nullable=False)

    groups = db.relationship("Group", secondary=group_contacts, back_populates="contacts")

    __table_args__ = (
        db.Index("ix_contacts_client_phone", "client_account_id", "phone"),
        db.Index("ix_contacts_client_phonee164", "client_account_id", "phone_e164"),
    )

    serialize_rules = ()


# -----------------------------
# GROUP MODEL
# -----------------------------
class Group(db.Model, SerializerMixin, TimestampMixin):
    __tablename__ = "groups"

    id = db.Column(db.Integer, primary_key=True)

    client_account_id = db.Column(db.Integer, db.ForeignKey("client_accounts.id", ondelete="CASCADE"), nullable=False, index=True)

    created_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    created_by = db.relationship("User", foreign_keys=[created_by_user_id])

    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)

    contacts = db.relationship("Contact", secondary=group_contacts, back_populates="groups")

    __table_args__ = (
        db.UniqueConstraint("client_account_id", "name", name="uq_group_name_per_client"),
        db.Index("ix_groups_client", "client_account_id"),
    )

    serialize_rules = ()


# -----------------------------
# BILLING: INVOICE + ITEMS + PAYMENT
# -----------------------------
class Invoice(db.Model, SerializerMixin, TimestampMixin):
    __tablename__ = "invoices"

    id = db.Column(db.Integer, primary_key=True)

    client_account_id = db.Column(db.Integer, db.ForeignKey("client_accounts.id", ondelete="CASCADE"), nullable=False, index=True)

    invoice_no = db.Column(db.String(40), unique=True, nullable=False, index=True)

    status = db.Column(
        db.Enum("draft", "sent", "paid", "void", "overdue", name="invoice_status"),
        default="draft",
        nullable=False,
    )

    currency = db.Column(db.String(10), default="KES", nullable=False)
    subtotal_kes = db.Column(db.Numeric(10, 2), default=0, nullable=False)
    tax_kes = db.Column(db.Numeric(10, 2), default=0, nullable=False)
    total_kes = db.Column(db.Numeric(10, 2), default=0, nullable=False)

    due_date = db.Column(db.DateTime)
    note = db.Column(db.String(255))

    items = db.relationship("InvoiceItem", backref="invoice", lazy=True, cascade="all, delete-orphan", passive_deletes=True)
    payments = db.relationship("Payment", backref="invoice", lazy=True, cascade="all, delete-orphan", passive_deletes=True)

    serialize_rules = ()


class InvoiceItem(db.Model, SerializerMixin, TimestampMixin):
    __tablename__ = "invoice_items"

    id = db.Column(db.Integer, primary_key=True)

    invoice_id = db.Column(db.Integer, db.ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)

    description = db.Column(db.String(255), nullable=False)

    quantity = db.Column(db.Integer, default=1, nullable=False)
    unit_price_kes = db.Column(db.Numeric(10, 2), default=0, nullable=False)
    line_total_kes = db.Column(db.Numeric(10, 2), default=0, nullable=False)

    sender_id_id = db.Column(db.Integer, db.ForeignKey("sender_ids.id", ondelete="SET NULL"), nullable=True, index=True)
    subscription_id = db.Column(db.Integer, db.ForeignKey("subscriptions.id", ondelete="SET NULL"), nullable=True, index=True)

    serialize_rules = ()


class Payment(db.Model, SerializerMixin, TimestampMixin):
    """
    Payment row should be idempotent for a given STK checkout_request_id.
    This prevents duplicate payment rows for the same STK request.
    """
    __tablename__ = "payments"

    id = db.Column(db.Integer, primary_key=True)

    client_account_id = db.Column(db.Integer, db.ForeignKey("client_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey("invoices.id", ondelete="SET NULL"), nullable=True, index=True)

    status = db.Column(
        db.Enum("pending", "confirmed", "failed", "reversed", name="payment_status"),
        default="pending",
        nullable=False,
        index=True,
    )

    method = db.Column(
        db.Enum("mpesa", "bank", "cash", "card", name="payment_method"),
        default="mpesa",
        nullable=False,
        index=True,
    )

    amount_kes = db.Column(db.Numeric(10, 2), nullable=False)

    # M-Pesa details
    mpesa_receipt = db.Column(db.String(40), index=True)
    payer_phone = db.Column(db.String(20))
    raw_payload = db.Column(db.JSON)

    # Key fields for idempotency and reconciliation
    checkout_request_id = db.Column(db.String(80), index=True)
    merchant_request_id = db.Column(db.String(80), index=True)

    confirmed_at = db.Column(db.DateTime)

    __table_args__ = (
        db.UniqueConstraint("client_account_id", "checkout_request_id", name="uq_payment_client_checkout"),
        db.Index("ix_payments_client_status", "client_account_id", "status"),
    )

    serialize_rules = ()


# -----------------------------
# CREDIT TRANSACTIONS LEDGER
# -----------------------------
class CreditTransaction(db.Model, SerializerMixin, TimestampMixin):
    __tablename__ = "credit_transactions"

    id = db.Column(db.Integer, primary_key=True)

    client_account_id = db.Column(db.Integer, db.ForeignKey("client_accounts.id", ondelete="CASCADE"), nullable=False, index=True)

    tx_type = db.Column(db.Enum("topup", "deduction", "refund", "adjustment", name="credit_tx_type"), nullable=False)

    amount_units = db.Column(db.Integer, nullable=False)
    balance_before = db.Column(db.Integer, nullable=False)
    balance_after = db.Column(db.Integer, nullable=False)

    invoice_id = db.Column(db.Integer, db.ForeignKey("invoices.id", ondelete="SET NULL"), nullable=True, index=True)
    payment_id = db.Column(db.Integer, db.ForeignKey("payments.id", ondelete="SET NULL"), nullable=True, index=True)

    reference = db.Column(db.String(120))
    description = db.Column(db.String(255))

    created_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    created_by = db.relationship("User", foreign_keys=[created_by_user_id])

    invoice = db.relationship("Invoice", foreign_keys=[invoice_id])
    payment = db.relationship("Payment", foreign_keys=[payment_id])

    serialize_rules = ()


# -----------------------------
# MPESA STK REQUEST MODEL
# -----------------------------
class MpesaStkRequest(db.Model, SerializerMixin, TimestampMixin):
    """
    Stores the initial STK Push request so the callback can be mapped to the right tenant.
    Also helps idempotency (avoid double-crediting).
    """
    __tablename__ = "mpesa_stk_requests"

    id = db.Column(db.Integer, primary_key=True)

    client_account_id = db.Column(db.Integer, db.ForeignKey("client_accounts.id", ondelete="CASCADE"), nullable=False, index=True)

    invoice_id = db.Column(db.Integer, db.ForeignKey("invoices.id", ondelete="SET NULL"), nullable=True, index=True)

    merchant_request_id = db.Column(db.String(80), index=True)
    checkout_request_id = db.Column(db.String(80), unique=True, nullable=False, index=True)

    phone = db.Column(db.String(20), nullable=False)
    amount_kes = db.Column(db.Numeric(10, 2), nullable=False)

    status = db.Column(
        db.Enum("pending", "confirmed", "failed", name="mpesa_stk_request_status"),
        default="pending",
        nullable=False,
        index=True,
    )

    mpesa_receipt = db.Column(db.String(40), unique=True, index=True)

    # Callback result
    result_code = db.Column(db.Integer, nullable=True, index=True)
    result_desc = db.Column(db.String(255), nullable=True)

    raw_request = db.Column(db.JSON)
    raw_callback = db.Column(db.JSON)

    invoice = db.relationship("Invoice")

    __table_args__ = (
        db.Index("ix_mpesa_stk_client_status", "client_account_id", "status"),
    )

    serialize_rules = ()


# -----------------------------
# CAMPAIGN MODEL
# -----------------------------
class Campaign(db.Model, SerializerMixin, TimestampMixin):
    __tablename__ = "campaigns"

    id = db.Column(db.Integer, primary_key=True)

    client_account_id = db.Column(db.Integer, db.ForeignKey("client_accounts.id", ondelete="CASCADE"), nullable=False, index=True)

    sender_id_id = db.Column(db.Integer, db.ForeignKey("sender_ids.id", ondelete="SET NULL"), nullable=True, index=True)
    sender_id = db.relationship("SenderID")

    name = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)

    message_type = db.Column(
        db.Enum("transactional", "promotional", "otp", name="campaign_message_type"),
        default="promotional",
        nullable=False,
        index=True,
    )

    status = db.Column(
        db.Enum("draft", "scheduled", "sending", "completed", "failed", name="campaign_status"),
        default="draft",
        nullable=False,
        index=True,
    )

    scheduled_for = db.Column(db.DateTime, nullable=True)

    provider = db.Column(db.String(50), default="advantasms", nullable=False)
    provider_batch_id = db.Column(db.String(128), nullable=True)

    total_recipients = db.Column(db.Integer, default=0, nullable=False)
    total_sent = db.Column(db.Integer, default=0, nullable=False)
    total_failed = db.Column(db.Integer, default=0, nullable=False)

    created_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    created_by = db.relationship("User", foreign_keys=[created_by_user_id])

    messages = db.relationship("Message", backref="campaign", lazy=True, cascade="all, delete-orphan", passive_deletes=True)

    __table_args__ = (
        db.Index("ix_campaigns_client_status", "client_account_id", "status"),
    )

    serialize_rules = ()


# -----------------------------
# MESSAGE MODEL
# -----------------------------
class Message(db.Model, SerializerMixin, TimestampMixin):
    __tablename__ = "messages"

    id = db.Column(db.Integer, primary_key=True)

    client_account_id = db.Column(db.Integer, db.ForeignKey("client_accounts.id", ondelete="CASCADE"), nullable=False, index=True)

    campaign_id = db.Column(db.Integer, db.ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=True, index=True)

    contact_id = db.Column(db.Integer, db.ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True, index=True)
    contact = db.relationship("Contact")

    phone = db.Column(db.String(20), nullable=False)
    phone_e164 = db.Column(db.String(20), index=True)

    body = db.Column(db.Text, nullable=False)

    message_type = db.Column(
        db.Enum("transactional", "promotional", "otp", name="message_type"),
        default="transactional",
        nullable=False,
        index=True,
    )

    status = db.Column(
        db.Enum("queued", "sent", "delivered", "failed", name="message_status"),
        default="queued",
        nullable=False,
        index=True,
    )

    units = db.Column(db.Integer, default=1, nullable=False)

    sell_price_per_sms_kes_snapshot = db.Column(db.Numeric(10, 2))
    cost_price_per_sms_kes_snapshot = db.Column(db.Numeric(10, 2))

    provider = db.Column(db.String(50), default="advantasms", nullable=False)

    provider_message_id = db.Column(db.String(128), index=True)
    client_sms_id = db.Column(db.String(64), index=True)

    provider_status = db.Column(db.String(60))
    provider_response_code = db.Column(db.Integer)
    provider_response_desc = db.Column(db.String(120))
    network_id = db.Column(db.String(20))

    callback_payload = db.Column(db.JSON)

    error_code = db.Column(db.String(64))
    error_message = db.Column(db.Text)

    sent_at = db.Column(db.DateTime)
    delivered_at = db.Column(db.DateTime)

    __table_args__ = (
        db.Index("ix_messages_client_status_created", "client_account_id", "status", "created_at"),
        db.Index("ix_messages_campaign_status", "campaign_id", "status"),
        db.Index("ix_messages_phone", "phone"),
        db.Index("ix_messages_phonee164", "phone_e164"),
        db.Index("ix_messages_provider_id", "provider_message_id"),
        db.Index("ix_messages_type", "client_account_id", "message_type"),
    )

    serialize_rules = ()
