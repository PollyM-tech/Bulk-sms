# decorators.py
from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt

def role_required(required_role: str):
    """
    Restricts endpoint access to users with the given role.
    Usage:
        @jwt_required()
        @role_required("admin")
        def get(...):
            ...
    """
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()  # ensures JWT is valid
            claims = get_jwt()       # get data encoded in token (like 'role')

            if claims.get("role") != required_role:
                return jsonify({"message": "Forbidden: insufficient permissions"}), 403

            return fn(*args, **kwargs)
        return decorator
    return wrapper
