# resources/messages.py
from datetime import datetime
from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required

from models import db, ClientAccount, Message, CreditTransaction
from ._helpers import current_client_account_id, current_user_id, require_role
from services.advanta_sms import AdvantaSMSClient


def _calc_units(text: str) -> int:
    """
    Simple SMS units calculator:
      - ~160 chars per unit (basic MVP)
      - You can later enhance for unicode / GSM-7 vs UCS-2 rules.
    """
    if not text:
        return 1
    return (len(text) - 1) // 160 + 1


def _parse_advanta_response(resp: dict) -> dict:
    """
    AdvantaSMS often returns JSON like:
    {
      "responses": [{
        "respose-code": 200,
        "response-description": "Success",
        "messageid": 12345,
        "networkid": "1"
      }]
    }
    Note: key is sometimes misspelled as 'respose-code' in sample payloads.
    """
    payload = resp.get("json") or {}
    responses = payload.get("responses") or []
    first = responses[0] if responses else {}

    code = first.get("respose-code")
    if code is None:
        code = first.get("response-code")  # fallback if they ever fix spelling

    return {
        "raw": payload,
        "code": code,
        "desc": first.get("response-description"),
        "messageid": first.get("messageid") or first.get("messageID") or first.get("messageId"),
        "networkid": first.get("networkid") or first.get("networkId"),
    }


class MessageListResource(Resource):
    @jwt_required()
    def get(self):
        client_id = current_client_account_id()
        if not client_id:
            return {"message": "No client_account_id in token"}, 400

        status = request.args.get("status")
        mtype = request.args.get("message_type")
        limit = int(request.args.get("limit", "100"))

        q = Message.query.filter_by(client_account_id=client_id).order_by(Message.created_at.desc())
        if status:
            q = q.filter(Message.status == status)
        if mtype:
            q = q.filter(Message.message_type == mtype)

        msgs = q.limit(min(max(limit, 1), 500)).all()

        out = []
        for m in msgs:
            out.append({
                "id": m.id,
                "phone": m.phone,
                "body": m.body,
                "message_type": m.message_type,
                "status": m.status,
                "units": m.units,
                "provider": m.provider,
                "provider_message_id": m.provider_message_id,
                "provider_status": m.provider_status,
                "provider_response_code": m.provider_response_code,
                "provider_response_desc": m.provider_response_desc,
                "error_message": m.error_message,
                "created_at": m.created_at.isoformat() if m.created_at else None,
                "sent_at": m.sent_at.isoformat() if m.sent_at else None,
            })
        return out, 200


class MessageResource(Resource):
    @jwt_required()
    def get(self, message_id: int):
        client_id = current_client_account_id()
        msg = Message.query.filter_by(id=message_id, client_account_id=client_id).first()
        if not msg:
            return {"message": "Message not found"}, 404

        return {
            "id": msg.id,
            "phone": msg.phone,
            "body": msg.body,
            "message_type": msg.message_type,
            "status": msg.status,
            "units": msg.units,
            "provider": msg.provider,
            "provider_message_id": msg.provider_message_id,
            "client_sms_id": getattr(msg, "client_sms_id", None),
            "provider_status": msg.provider_status,
            "provider_response_code": msg.provider_response_code,
            "provider_response_desc": msg.provider_response_desc,
            "network_id": getattr(msg, "network_id", None),
            "callback_payload": msg.callback_payload,
            "error_code": msg.error_code,
            "error_message": msg.error_message,
            "created_at": msg.created_at.isoformat() if msg.created_at else None,
            "sent_at": msg.sent_at.isoformat() if msg.sent_at else None,
            "delivered_at": msg.delivered_at.isoformat() if msg.delivered_at else None,
        }, 200


class SendMessageResource(Resource):
    """
    POST /messages/send

    Body:
    {
      "phone": "+2547xxxxxxx",
      "message": "Hello",
      "shortcode": "XXXX",                (optional)
      "message_type": "transactional"     (optional: transactional|promotional)
    }
    """
    @jwt_required()
    @require_role("admin", "user", "superadmin")
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
        phone = data.get("phone")
        text = data.get("message")
        shortcode = data.get("shortcode") or client.default_shortcode
        mtype = (data.get("message_type") or "transactional").lower()

        if not phone or not text:
            return {"message": "phone and message are required"}, 400

        units = _calc_units(text)
        if client.credits_balance < units:
            return {
                "message": "Insufficient credits",
                "needed_units": units,
                "balance": client.credits_balance,
            }, 402

        # snapshot prices at send time
        sell_snapshot = client.sell_price_per_sms_kes
        cost_snapshot = client.cost_price_per_sms_kes

        balance_before = client.credits_balance
        balance_after = balance_before - units

        # Create Message row first (queued)
        msg = Message(
            client_account_id=client.id,
            campaign_id=None,
            contact_id=None,
            phone=phone,
            phone_e164=phone,
            body=text,
            message_type=mtype if mtype in {"transactional", "promotional", "otp"} else "transactional",
            status="queued",
            units=units,
            sell_price_per_sms_kes_snapshot=sell_snapshot,
            cost_price_per_sms_kes_snapshot=cost_snapshot,
            provider="advantasms",
        )
        db.session.add(msg)
        db.session.flush()  # so msg.id exists

        # Deduct wallet + ledger
        client.credits_balance = balance_after
        tx = CreditTransaction(
            client_account_id=client.id,
            tx_type="deduction",
            amount_units=units,
            balance_before=balance_before,
            balance_after=balance_after,
            reference=f"msg:{msg.id}",
            description=f"SMS send ({msg.message_type}) to {phone}",
            created_by_user_id=current_user_id(),
        )
        db.session.add(tx)
        db.session.commit()

        # Send to provider
        client_api = AdvantaSMSClient()
        try:
            resp = client_api.send_sms(mobile=phone, message=text, shortcode=shortcode)
            parsed = _parse_advanta_response(resp)

            msg.sent_at = datetime.utcnow()
            msg.callback_payload = parsed["raw"]

            msg.provider_response_code = parsed["code"]
            msg.provider_response_desc = parsed["desc"]
            msg.provider_message_id = str(parsed["messageid"]) if parsed["messageid"] is not None else None
            if hasattr(msg, "network_id"):
                msg.network_id = str(parsed["networkid"]) if parsed["networkid"] is not None else None

            ok = (parsed["code"] == 200) or (resp.get("status_code") in (200, 201))
            msg.status = "sent" if ok else "failed"
            msg.provider_status = "sent" if ok else "failed"
            msg.error_message = None if ok else (resp.get("text") or parsed["desc"])

        except Exception as e:
            # Mark failed + refund + ledger refund
            msg.status = "failed"
            msg.provider_status = "exception"
            msg.error_message = str(e)

            refund_before = client.credits_balance
            client.credits_balance = refund_before + units

            refund_tx = CreditTransaction(
                client_account_id=client.id,
                tx_type="refund",
                amount_units=units,
                balance_before=refund_before,
                balance_after=client.credits_balance,
                reference=f"msg:{msg.id}",
                description="Refund: provider failure/exception",
                created_by_user_id=current_user_id(),
            )
            db.session.add(refund_tx)

        db.session.commit()

        return {
            "message_id": msg.id,
            "status": msg.status,
            "units": msg.units,
            "credits_balance": client.credits_balance,
            "provider_status": msg.provider_status,
            "provider_message_id": msg.provider_message_id,
            "provider_response_code": msg.provider_response_code,
            "provider_response_desc": msg.provider_response_desc,
            "provider_payload": msg.callback_payload,
            "error_message": msg.error_message,
        }, 200 if msg.status == "sent" else 502


class SendOtpResource(Resource):
    """
    POST /messages/send-otp

    Body:
    {
      "phone": "+2547xxxxxxx",
      "message": "Your OTP is 1234",
      "shortcode": "XXXX" (optional),
      "method": "post" or "get" (optional; default post)
    }
    """
    @jwt_required()
    @require_role("admin", "user", "superadmin")
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
        phone = data.get("phone")
        text = data.get("message")
        shortcode = data.get("shortcode") or client.default_shortcode
        method = (data.get("method") or "post").lower()

        if not phone or not text:
            return {"message": "phone and message are required"}, 400

        units = _calc_units(text)
        if client.credits_balance < units:
            return {
                "message": "Insufficient credits",
                "needed_units": units,
                "balance": client.credits_balance,
            }, 402

        balance_before = client.credits_balance
        balance_after = balance_before - units

        msg = Message(
            client_account_id=client.id,
            campaign_id=None,
            contact_id=None,
            phone=phone,
            phone_e164=phone,
            body=text,
            message_type="otp",
            status="queued",
            units=units,
            sell_price_per_sms_kes_snapshot=client.sell_price_per_sms_kes,
            cost_price_per_sms_kes_snapshot=client.cost_price_per_sms_kes,
            provider="advantasms",
        )
        db.session.add(msg)
        db.session.flush()

        # Deduct + ledger
        client.credits_balance = balance_after
        tx = CreditTransaction(
            client_account_id=client.id,
            tx_type="deduction",
            amount_units=units,
            balance_before=balance_before,
            balance_after=balance_after,
            reference=f"msg:{msg.id}",
            description=f"OTP send to {phone}",
            created_by_user_id=current_user_id(),
        )
        db.session.add(tx)
        db.session.commit()

        client_api = AdvantaSMSClient()
        try:
            if method == "get":
                resp = client_api.send_otp_get(mobile=phone, message=text, shortcode=shortcode)
            else:
                resp = client_api.send_otp_post(mobile=phone, message=text, shortcode=shortcode)

            parsed = _parse_advanta_response(resp)

            msg.sent_at = datetime.utcnow()
            msg.callback_payload = parsed["raw"]
            msg.provider_response_code = parsed["code"]
            msg.provider_response_desc = parsed["desc"]

            ok = (parsed["code"] == 200) or (resp.get("status_code") in (200, 201))
            msg.status = "sent" if ok else "failed"
            msg.provider_status = "sent" if ok else "failed"
            msg.error_message = None if ok else (resp.get("text") or parsed["desc"])

        except Exception as e:
            msg.status = "failed"
            msg.provider_status = "exception"
            msg.error_message = str(e)

            refund_before = client.credits_balance
            client.credits_balance = refund_before + units

            refund_tx = CreditTransaction(
                client_account_id=client.id,
                tx_type="refund",
                amount_units=units,
                balance_before=refund_before,
                balance_after=client.credits_balance,
                reference=f"msg:{msg.id}",
                description="Refund: OTP provider failure/exception",
                created_by_user_id=current_user_id(),
            )
            db.session.add(refund_tx)

        db.session.commit()

        return {
            "message_id": msg.id,
            "status": msg.status,
            "units": msg.units,
            "credits_balance": client.credits_balance,
            "provider_status": msg.provider_status,
            "provider_response_code": msg.provider_response_code,
            "provider_response_desc": msg.provider_response_desc,
            "provider_payload": msg.callback_payload,
            "error_message": msg.error_message,
        }, 200 if msg.status == "sent" else 502


class RefreshDlrResource(Resource):
    @jwt_required()
    def post(self, message_id: int):
        return {
            "message": "DLR refresh not implemented yet (we’ll add after confirming Advanta DLR endpoint)."
        }, 501
