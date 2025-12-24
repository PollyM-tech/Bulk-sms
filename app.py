import os
from datetime import timedelta
from flask import Flask
from flask_restful import Api
from flask_cors import CORS
from dotenv import load_dotenv
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from models import db
from resources import register_resources

load_dotenv()


def create_app() -> Flask:
    app = Flask(__name__)
    api = Api(app)

    # --- Config ---
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("SQLALCHEMY_DATABASE_URI")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # turn off echo unless debugging
    app.config["SQLALCHEMY_ECHO"] = os.getenv("SQLALCHEMY_ECHO", "false").lower() == "true"

    # JWT
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-secret-change-me")
    expires_minutes = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", "480"))
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=expires_minutes)


    # --- Extensions ---
    db.init_app(app)
    Migrate(app, db)
    JWTManager(app)

    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

    Limiter(
        get_remote_address,
        app=app,
        default_limits=[
            os.getenv("RATE_LIMIT_DAILY", "2000 per day"),
            os.getenv("RATE_LIMIT_HOURLY", "300 per hour"),
        ],
    )

    @app.get("/")
    def index():
        return {"message": "Bulk SMS API (multi-tenant + billing + AdvantaSMS)"}, 200

    # Register all API routes
    register_resources(api)

    return app


app = create_app()

if __name__ == "__main__":
    app.run(
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "5000")),
        debug=os.getenv("FLASK_DEBUG", "true").lower() == "true",
    )
