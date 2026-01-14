import os
from datetime import timedelta
from unittest import result

from flask import Flask, request, jsonify
from flask_restful import Api
from flask_cors import CORS
from dotenv import load_dotenv
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from mpesa import MpesaService
from models import db
from resources import register_resources

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))


def create_app() -> Flask:
    app = Flask(__name__)
    api = Api(app)

    # ----------------------------
    # Config
    # ----------------------------
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("SQLALCHEMY_DATABASE_URI")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Turn off SQL echo unless debugging
    app.config["SQLALCHEMY_ECHO"] = os.getenv("SQLALCHEMY_ECHO", "false").lower() == "true"

    # JWT config
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-secret-change-me")
    expires_minutes = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", "480"))
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=expires_minutes)

    # ----------------------------
    # Extensions
    # ----------------------------
    db.init_app(app)
    Migrate(app, db)
    JWTManager(app)

    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

    Limiter(
        key_func=get_remote_address,
        app=app,
        default_limits=[
            os.getenv("RATE_LIMIT_DAILY", "2000 per day"),
            os.getenv("RATE_LIMIT_HOURLY", "300 per hour"),
        ],
    )

    # ----------------------------
    # Services
    # ----------------------------
    mpesa_service = MpesaService()

    # ----------------------------
    # Routes
    # ----------------------------
    @app.post("/api/mpesa/stk/callback")
    def mpesa_stk_callback():
        payload = request.get_json(force=True, silent=True) or {}
        print("✅ MPESA CALLBACK HIT:", payload)

        normalized = mpesa_service.handle_stk_callback(payload)
        result = mpesa_service.apply_payment(normalized)
        print("✅ NORMALIZED:", normalized)
        print("✅ APPLY RESULT:", result)

        return jsonify({"ok": True, "normalized": normalized, "result": result}), 200

    
    @app.get("/")
    def index():
        return jsonify({"message": "Bulk SMS API (multi-tenant + billing + AdvantaSMS)"}), 200

    @app.post("/api/mpesa/stk/push")
    def stk_push():
        try:
            body = request.get_json(force=True, silent=True) or {}

            client_account_id = int(body.get("client_account_id", 0))
            phone = body.get("phone")
            amount_kes = body.get("amount_kes")

            if not client_account_id or not phone or amount_kes is None:
                return jsonify({
                    "ok": False,
                    "error": "Missing required fields: client_account_id, phone, amount_kes"
                    }), 400
            invoice_id = body.get("invoice_id")  # optional
            desc = body.get("transaction_desc", "Bulk SMS topup")

            result = mpesa_service.initiate_stk_push(
                client_account_id=client_account_id,
                phone_number=phone,
                amount_kes=amount_kes,
                invoice_id=invoice_id,
                transaction_desc=desc,
            )
            return jsonify(result), 200
        except Exception as e:
            return jsonify({"ok": False, "error": str(e)}), 500

    # Register all API routes (Flask-RESTful resources)
    register_resources(api)

    return app


app = create_app()

if __name__ == "__main__":
    app.run(
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "5000")),
        debug=os.getenv("FLASK_DEBUG", "true").lower() == "true",
    )
