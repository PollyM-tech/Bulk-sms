# services/advanta_sms.py
import os
import requests
from typing import Any, Dict, Optional


class AdvantaSMSClient:
    """
    Minimal HTTP client for AdvantaSMS.

    Env vars required:
      ADVANTA_BASE_URL (e.g. https://quicksms.advantasms.com)
      ADVANTA_PARTNER_ID
      ADVANTA_API_KEY
      ADVANTA_SHORTCODE (optional default)
    """

    def __init__(self):
        self.base_url = (os.getenv("ADVANTA_BASE_URL") or "").rstrip("/")
        self.partner_id = os.getenv("ADVANTA_PARTNER_ID")
        self.api_key = os.getenv("ADVANTA_API_KEY")
        self.default_shortcode = os.getenv("ADVANTA_SHORTCODE")

        if not self.base_url:
            raise RuntimeError("Missing ADVANTA_BASE_URL in .env")
        if not self.partner_id:
            raise RuntimeError("Missing ADVANTA_PARTNER_ID in .env")
        if not self.api_key:
            raise RuntimeError("Missing ADVANTA_API_KEY in .env")

    def send_sms(self, mobile: str, message: str, shortcode: Optional[str] = None) -> Dict[str, Any]:
        """
        NOTE: Advanta normal SMS endpoint may differ (they gave sendotp endpoint explicitly).
        We'll still implement a 'send_sms' stub and you can update the endpoint once you confirm
        their standard send SMS URL from docs or Postman collection.
        """
        # Placeholder endpoint — UPDATE after you import their Postman collection / docs
        url = f"{self.base_url}/api/services/sendsms/"
        payload = {
            "apikey": self.api_key,
            "partnerID": self.partner_id,
            "mobile": mobile,
            "message": message,
            "shortcode": shortcode or self.default_shortcode,
        }
        r = requests.post(url, json=payload, timeout=30)
        return {"status_code": r.status_code, "json": _safe_json(r), "text": r.text}

    def send_otp_post(self, mobile: str, message: str, shortcode: Optional[str] = None) -> Dict[str, Any]:
        url = f"{self.base_url}/api/services/sendotp/"
        payload = {
            "apikey": self.api_key,
            "partnerID": self.partner_id,
            "mobile": mobile,
            "message": message,
            "shortcode": shortcode or self.default_shortcode,
        }
        r = requests.post(url, json=payload, timeout=30)
        return {"status_code": r.status_code, "json": _safe_json(r), "text": r.text}

    def send_otp_get(self, mobile: str, message: str, shortcode: Optional[str] = None) -> Dict[str, Any]:
        url = f"{self.base_url}/api/services/sendotp/"
        params = {
            "message": message,
            "mobile": mobile,
            "shortcode": shortcode or self.default_shortcode,
            "partnerID": self.partner_id,
            "apikey": self.api_key,
        }
        r = requests.get(url, params=params, timeout=30)
        return {"status_code": r.status_code, "json": _safe_json(r), "text": r.text}


def _safe_json(resp: requests.Response):
    try:
        return resp.json()
    except Exception:
        return None
