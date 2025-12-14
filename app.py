import os
from flask import Flask
from flask_restful import Api
from flask_cors import CORS
from dotenv import load_dotenv
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from models import db

# NEW: import auth resources
from resources.auth import (
    RegisterResource,
    LoginResource,
    LogoutResource,
    PasswordResetRequestResource,
    PasswordResetResource,
)
from resources.contacts import (
    ContactListResource,
    ContactResource,
    ContactOptOutResource,
)

from resources.groups import (
    GroupListResource,
    GroupResource,
    GroupContactsResource,
    GroupContactItemResource,
)


load_dotenv()

app = Flask(__name__)
api = Api(app)

# --- Config ---
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("SQLALCHEMY_DATABASE_URI")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ECHO"] = True

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
# You also set an 8h expiry in LoginResource; that's okay for now.
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False

# --- Extensions ---
db.init_app(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
)


@app.route("/")
def index():
    return {"message": "Bulk sms system"}, 200


# ---- Register auth routes ----
api.add_resource(RegisterResource, "/auth/register")
api.add_resource(LoginResource, "/auth/login")
api.add_resource(LogoutResource, "/auth/logout")
api.add_resource(PasswordResetRequestResource, "/auth/request-reset")
api.add_resource(PasswordResetResource, "/auth/reset-password")

# ---- Contact routes ----
api.add_resource(ContactListResource, "/contacts")
api.add_resource(ContactResource, "/contacts/<int:contact_id>")
api.add_resource(ContactOptOutResource, "/contacts/<int:contact_id>/opt-out")

# ---- Group routes ----
api.add_resource(GroupListResource, "/groups")
api.add_resource(GroupResource, "/groups/<int:group_id>")
api.add_resource(GroupContactsResource, "/groups/<int:group_id>/contacts")
api.add_resource(GroupContactItemResource, "/groups/<int:group_id>/contacts/<int:contact_id>")



if __name__ == "__main__":
    app.run(debug=True)
