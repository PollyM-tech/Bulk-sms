# resources/__init__.py
from flask_restful import Api

from .auth import (
    RegisterResource,
    LoginResource,
    LogoutResource,
    PasswordResetRequestResource,
    PasswordResetResource,
)

from .billing import (
    BillingBalanceResource,
    BillingLedgerResource,
    BillingTopUpResource,
    InvoiceListResource,
    InvoiceResource,
    InvoiceMarkPaidResource,
)
from .messages import (
    MessageListResource,
    MessageResource,
    SendMessageResource,
    SendOtpResource,
    RefreshDlrResource,
)



def register_resources(api: Api) -> None:
    # Auth
    api.add_resource(RegisterResource, "/auth/register")
    api.add_resource(LoginResource, "/auth/login")
    api.add_resource(LogoutResource, "/auth/logout")
    api.add_resource(PasswordResetRequestResource, "/auth/request-reset")
    api.add_resource(PasswordResetResource, "/auth/reset-password")

    # Billing (credits control)
    api.add_resource(BillingBalanceResource, "/billing/balance")
    api.add_resource(BillingLedgerResource, "/billing/ledger")
    api.add_resource(BillingTopUpResource, "/billing/topup")

    # Invoice stubs (for later)
    api.add_resource(InvoiceListResource, "/invoices")
    api.add_resource(InvoiceResource, "/invoices/<int:invoice_id>")
    api.add_resource(InvoiceMarkPaidResource, "/invoices/<int:invoice_id>/mark-paid")

    # Messages
    api.add_resource(MessageListResource, "/messages")
    api.add_resource(MessageResource, "/messages/<int:message_id>")
    api.add_resource(SendMessageResource, "/messages/send")
    api.add_resource(SendOtpResource, "/messages/send-otp")
    api.add_resource(RefreshDlrResource, "/messages/<int:message_id>/refresh-dlr")

    #mpesa routes will be added in app.py
    print("MPESA_ENV:", self.env)
    print("BASE_URL:", self.base_url)
    print("CK:", repr(self.consumer_key), "len=", len(self.consumer_key))
    print("CS:", repr(self.consumer_secret), "len=", len(self.consumer_secret))