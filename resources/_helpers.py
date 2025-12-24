# resources/_helpers.py
from functools import wraps
from flask_jwt_extended import get_jwt, get_jwt_identity
from flask_restful import abort

from models import User

def current_user_id() -> int:
    return int(get_jwt_identity())


def jwt_claims() -> dict:
    return get_jwt() or {}


def current_role() -> str:
    return (jwt_claims().get("role") or "user").lower()


def current_client_account_id() -> int | None:
    # superadmin may have None
    return jwt_claims().get("client_account_id")


def require_role(*allowed_roles: str):
    allowed = {r.lower() for r in allowed_roles}

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            role = current_role()
            if role not in allowed:
                abort(403, message="Forbidden: insufficient role")
            return fn(*args, **kwargs)
        return wrapper

    return decorator


def load_current_user() -> User:
    user = User.query.get(current_user_id())
    if not user:
        abort(401, message="Invalid token user")
    if not user.is_active:
        abort(403, message="User is inactive")
    return user
