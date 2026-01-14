import os
import base64
from datetime import datetime
from decimal import Decimal, ROUND_FLOOR
from typing import Any, Dict, Optional

import requests

from models import db, ClientAccount, Payment, CreditTransaction, MpesaStkRequest


class MpesaService:
    def __init__(self):
        self._token: Optional[str] = None
        self._token_expiry: Optional[datetime] = None

    def get_access_token(self) -> str:
        # reuse token if still valid
        if self._token and self._token_expiry and datetime.utcnow() < self._token_expiry:
            return self._token

        url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
        r = requests.get(url, auth=(self.consumer_key, self.consumer_secret), timeout=30)

        if r.status_code != 200:
            raise RuntimeError(f"Token request failed: {r.status_code} text={r.text!r}")

        data = r.json()
        self._token = data["access_token"]
        # token valid for ~3600 seconds; keep some buffer
        self._token_expiry = datetime.utcnow() + timedelta(seconds=int(data.get("expires_in", 3599)) - 60)
        return self._token

    # -----------------------------
    # Helpers
    # -----------------------------
    def _timestamp(self) -> str:
        return datetime.now().strftime("%Y%m%d%H%M%S")

    def _stk_password(self, timestamp: str) -> str:
        raw = f"{self.shortcode}{self.passkey}{timestamp}"
        return base64.b64encode(raw.encode("utf-8")).decode("utf-8")

    def _normalize_phone(self, phone: str) -> str:
        p = (phone or "").strip().replace(" ", "").replace("-", "")
        if p.startswith("+"):
            p = p[1:]
        # 07xxxxxxxx -> 2547xxxxxxxx
        if p.startswith("0") and len(p) == 10:
            p = "254" + p[1:]
        # 7xxxxxxxx -> 2547xxxxxxxx (optional convenience)
        if p.startswith("7") and len(p) == 9:
            p = "254" + p
        return p

    def _safe_json(self, r: requests.Response) -> Dict[str, Any]:
        try:
            return r.json()
        except Exception:
            return {"raw_text": r.text}

    # -----------------------------
    # OAuth
    # -----------------------------
    def get_access_token(self) -> str:
        if not self.consumer_key or not self.consumer_secret:
            raise ValueError("Missing MPESA_CONSUMER_KEY or MPESA_CONSUMER_SECRET")

        url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
        r = requests.get(url, auth=(self.consumer_key, self.consumer_secret), timeout=30)

        # Helpful error if credentials wrong
        if r.status_code != 200:
            data = self._safe_json(r)
            raise RuntimeError(f"Token request failed: {r.status_code} -> {data}")

        return r.json()["access_token"]

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.get_access_token()}",
            "Content-Type": "application/json",
        }

    # -----------------------------
    # STK Push initiation
    # -----------------------------
    def initiate_stk_push(
        self,
        client_account_id: int,
        phone_number: str,
        amount_kes: int,
        invoice_id: Optional[int] = None,
        transaction_desc: str = "Bulk SMS topup",
    ) -> Dict[str, Any]:
        if not self.callback_url:
            raise ValueError("Missing MPESA_CALLBACK_URL (set it to your ngrok callback URL).")

        phone = self._normalize_phone(phone_number)
        if not phone.startswith("254") or len(phone) != 12:
            return {"ok": False, "status_code": 400, "response": {"error": "Invalid phone format", "phone": phone}}

        if amount_kes is None or int(amount_kes) <= 0:
            return {"ok": False, "status_code": 400, "response": {"error": "Amount must be > 0"}}

        timestamp = self._timestamp()
        password = self._stk_password(timestamp)
        url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"

        account_reference = f"CLIENT_{client_account_id}"

        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(amount_kes),
            "PartyA": phone,
            "PartyB": self.shortcode,
            "PhoneNumber": phone,
            "CallBackURL": self.callback_url,
            "AccountReference": account_reference,
            "TransactionDesc": transaction_desc,
        }

        r = requests.post(url, json=payload, headers=self._headers(), timeout=30)
        data = self._safe_json(r)

        if r.status_code != 200:
            return {"ok": False, "status_code": r.status_code, "response": data}

        checkout_id = data.get("CheckoutRequestID")
        merchant_id = data.get("MerchantRequestID")

        if checkout_id:
            req = MpesaStkRequest(
                client_account_id=client_account_id,
                invoice_id=invoice_id,
                merchant_request_id=merchant_id,
                checkout_request_id=checkout_id,
                phone=phone,
                amount_kes=Decimal(str(amount_kes)),
                status="pending",
                raw_request=payload,
            )
            db.session.add(req)
            db.session.commit()

        return {"ok": True, "response": data, "checkout_request_id": checkout_id}

    # -----------------------------
    # Callback parsing
    # -----------------------------
    def handle_stk_callback(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        stk = payload.get("Body", {}).get("stkCallback", {}) if isinstance(payload, dict) else {}

        result_code = stk.get("ResultCode")
        result_desc = stk.get("ResultDesc")
        merchant_request_id = stk.get("MerchantRequestID")
        checkout_request_id = stk.get("CheckoutRequestID")

        metadata = stk.get("CallbackMetadata", {}).get("Item", []) or []
        values = {
            item.get("Name"): item.get("Value")
            for item in metadata
            if isinstance(item, dict) and item.get("Name") is not None
        }

        return {
            "result_code": result_code,
            "result_desc": result_desc,
            "merchant_request_id": merchant_request_id,
            "checkout_request_id": checkout_request_id,
            "amount": values.get("Amount"),
            "receipt": values.get("MpesaReceiptNumber"),
            "phone": values.get("PhoneNumber"),
            "transaction_date": values.get("TransactionDate"),
            "raw": payload,
        }

    # -----------------------------
    # Apply payment (DB + idempotent)
    # -----------------------------
    def apply_payment(self, normalized: Dict[str, Any]) -> Dict[str, Any]:
        checkout_id = normalized.get("checkout_request_id")
        result_code = normalized.get("result_code")

        if checkout_id is None or result_code is None:
            return {"applied": False, "reason": "missing_checkout_or_result"}

        stk_req = MpesaStkRequest.query.filter_by(checkout_request_id=checkout_id).first()
        if not stk_req:
            return {"applied": False, "reason": "unknown_checkout_id"}

        # Always save raw callback
        stk_req.raw_callback = normalized.get("raw")

        # Idempotency
        if stk_req.status == "confirmed":
            db.session.commit()
            return {"applied": False, "reason": "already_confirmed"}

        # Failed payment
        if int(result_code) != 0:
            stk_req.status = "failed"
            self._upsert_payment(stk_req, normalized, status="failed")
            db.session.commit()
            return {"applied": False, "reason": "payment_failed", "desc": normalized.get("result_desc")}

        # Success
        receipt = normalized.get("receipt")
        phone = str(normalized.get("phone") or stk_req.phone)
        amount = Decimal(str(normalized.get("amount") or stk_req.amount_kes))

        # receipt idempotency across different checkout IDs
        if receipt:
            existing = MpesaStkRequest.query.filter(
                MpesaStkRequest.mpesa_receipt == receipt,
                MpesaStkRequest.checkout_request_id != checkout_id,
            ).first()
            if existing:
                db.session.commit()
                return {"applied": False, "reason": "duplicate_receipt"}

        stk_req.status = "confirmed"
        stk_req.mpesa_receipt = receipt

        payment = self._upsert_payment(stk_req, normalized, status="confirmed")

        units = int((amount / self.kes_per_unit).to_integral_value(rounding=ROUND_FLOOR))
        if units <= 0:
            units = 1  # minimum

        self._credit_client(
            client_account_id=stk_req.client_account_id,
            units=units,
            payment_id=payment.id,
            invoice_id=stk_req.invoice_id,
            reference=receipt or checkout_id,
            description=f"M-Pesa topup {amount} KES -> {units} SMS units",
        )

        db.session.commit()
        return {"applied": True, "client_account_id": stk_req.client_account_id, "units": units, "receipt": receipt}

    def _upsert_payment(self, stk_req: MpesaStkRequest, normalized: Dict[str, Any], status: str) -> Payment:
        receipt = normalized.get("receipt")
        phone = str(normalized.get("phone") or stk_req.phone)
        amount = Decimal(str(normalized.get("amount") or stk_req.amount_kes))

        payment = (
            Payment.query.filter_by(client_account_id=stk_req.client_account_id, mpesa_receipt=receipt).first()
            if receipt
            else None
        )

        if not payment:
            payment = Payment(
                client_account_id=stk_req.client_account_id,
                invoice_id=stk_req.invoice_id,
                method="mpesa",
                status=status,
                amount_kes=amount,
                mpesa_receipt=receipt,
                payer_phone=phone,
                raw_payload=normalized.get("raw"),
                confirmed_at=datetime.utcnow() if status == "confirmed" else None,
            )
            db.session.add(payment)
            db.session.flush()  # ensures payment.id exists before crediting
        else:
            payment.status = status
            payment.raw_payload = normalized.get("raw")
            if status == "confirmed":
                payment.confirmed_at = datetime.utcnow()

        return payment

    def _credit_client(
        self,
        client_account_id: int,
        units: int,
        payment_id: int,
        invoice_id: Optional[int],
        reference: str,
        description: str,
    ) -> None:
        client = ClientAccount.query.get(client_account_id)
        if not client:
            raise ValueError("ClientAccount not found")

        before = int(client.credits_balance or 0)
        after = before + int(units)
        client.credits_balance = after

        ledger = CreditTransaction(
            client_account_id=client_account_id,
            tx_type="topup",
            amount_units=int(units),
            balance_before=before,
            balance_after=after,
            invoice_id=invoice_id,
            payment_id=payment_id,
            reference=reference,
            description=description,
        )
        db.session.add(ledger)
