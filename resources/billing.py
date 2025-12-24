# resources/billing.py
from datetime import datetime
from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required

from models import db, ClientAccount, CreditTransaction, Payment
from ._helpers import current_client_account_id, current_user_id, require_role


class BillingBalanceResource(Resource):
    @jwt_required()
    def get(self):
        client_id = current_client_account_id()
        if not client_id:
            return {"message": "No client_account_id in token"}, 400

        client = ClientAccount.query.get(client_id)
        if not client:
            return {"message": "Client account not found"}, 404

        return {
            "client_account_id": client.id,
            "credits_balance": client.credits_balance,
            "sell_price_per_sms_kes": str(client.sell_price_per_sms_kes),
            "cost_price_per_sms_kes": str(client.cost_price_per_sms_kes),
        }, 200


class BillingLedgerResource(Resource):
    @jwt_required()
    def get(self):
        client_id = current_client_account_id()
        if not client_id:
            return {"message": "No client_account_id in token"}, 400

        txs = (
            CreditTransaction.query
            .filter_by(client_account_id=client_id)
            .order_by(CreditTransaction.created_at.desc())
            .limit(200)
            .all()
        )

        out = []
        for t in txs:
            out.append({
                "id": t.id,
                "tx_type": t.tx_type,
                "amount_units": t.amount_units,
                "balance_before": t.balance_before,
                "balance_after": t.balance_after,
                "reference": t.reference,
                "description": t.description,
                "invoice_id": t.invoice_id,
                "payment_id": t.payment_id,
                "created_by_user_id": t.created_by_user_id,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            })

        return out, 200


class BillingTopUpResource(Resource):
    """
    MVP Topup (manual-confirm flow)
    POST /billing/topup

    Body:
    {
      "amount_kes": 1000,
      "units": 4000,
      "method": "mpesa",
      "mpesa_receipt": "QGH12ABC",
      "payer_phone": "+2547xxxxxxx",
      "note": "Topup via MPESA"
    }

    - Creates Payment(status=confirmed)
    - Creates CreditTransaction(topup)
    - Updates ClientAccount.credits_balance
    """
    @jwt_required()
    @require_role("admin", "superadmin")
    def post(self):
        client_id = current_client_account_id()
        if not client_id:
            return {"message": "No client_account_id in token"}, 400

        client = ClientAccount.query.get(client_id)
        if not client:
            return {"message": "Client account not found"}, 404
        if client.status != "active":
            return {"message": "Client account is not active"}, 403

        data = request.get_json() or {}

        amount_kes = data.get("amount_kes")
        units = data.get("units")
        method = (data.get("method") or "mpesa").lower()
        mpesa_receipt = data.get("mpesa_receipt")
        payer_phone = data.get("payer_phone")
        note = data.get("note")

        if amount_kes is None or units is None:
            return {"message": "amount_kes and units are required"}, 400

        try:
            amount_kes = float(amount_kes)
            units = int(units)
            if units <= 0 or amount_kes <= 0:
                raise ValueError()
        except ValueError:
            return {"message": "amount_kes must be > 0 and units must be a positive integer"}, 400

        # Create payment (confirmed for MVP)
        payment = Payment(
            client_account_id=client.id,
            invoice_id=None,
            status="confirmed",
            method=method if method in {"mpesa", "bank", "cash", "card"} else "mpesa",
            amount_kes=amount_kes,
            mpesa_receipt=mpesa_receipt,
            payer_phone=payer_phone,
            raw_payload={"note": note} if note else None,
            confirmed_at=datetime.utcnow(),
        )
        db.session.add(payment)
        db.session.flush()

        # Update wallet + ledger entry
        balance_before = client.credits_balance
        balance_after = balance_before + units
        client.credits_balance = balance_after

        tx = CreditTransaction(
            client_account_id=client.id,
            tx_type="topup",
            amount_units=units,
            balance_before=balance_before,
            balance_after=balance_after,
            payment_id=payment.id,
            reference=mpesa_receipt,
            description=note or "Topup",
            created_by_user_id=current_user_id(),
        )
        db.session.add(tx)
        db.session.commit()

        return {
            "message": "Topup successful",
            "client_account_id": client.id,
            "payment": {
                "id": payment.id,
                "status": payment.status,
                "method": payment.method,
                "amount_kes": str(payment.amount_kes),
                "mpesa_receipt": payment.mpesa_receipt,
                "confirmed_at": payment.confirmed_at.isoformat() if payment.confirmed_at else None,
            },
            "transaction": {
                "id": tx.id,
                "tx_type": tx.tx_type,
                "amount_units": tx.amount_units,
                "balance_before": tx.balance_before,
                "balance_after": tx.balance_after,
            },
        }, 201


# Optional invoice endpoints (stub for later)
class InvoiceListResource(Resource):
    @jwt_required()
    def get(self):
        return {"message": "Not implemented yet. We'll add invoices after topups + sending work."}, 200

    @jwt_required()
    def post(self):
        return {"message": "Not implemented yet. We'll add invoices after topups + sending work."}, 501


class InvoiceResource(Resource):
    @jwt_required()
    def get(self, invoice_id: int):
        return {"message": "Not implemented yet."}, 501


class InvoiceMarkPaidResource(Resource):
    @jwt_required()
    def post(self, invoice_id: int):
        return {"message": "Not implemented yet."}, 501
