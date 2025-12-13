# resources/auth.py

from datetime import timedelta
from flask import request
from flask_restful import Resource
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    decode_token,
)
from models import db, User


# ---------- /auth/register ----------
class RegisterResource(Resource):
    def post(self):
        data = request.get_json() or {}
        name = data.get("name")
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return {"message": "Email and password are required"}, 400

        # Check if user already exists
        if User.query.filter_by(email=email).first():
            return {"message": "Email is already registered"}, 400

        # Create user
        user = User(name=name, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
        }, 201


# ---------- /auth/login ----------
class LoginResource(Resource):
    def post(self):
        data = request.get_json() or {}
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return {"message": "Email and password are required"}, 400

        user = User.query.filter_by(email=email).first()

        # Check credentials
        if not user or not user.check_password(password):
            return {"message": "Invalid email or password"}, 401

        if not user.is_active:
            return {"message": "User account is inactive"}, 403

        # include role in the JWT so we can enforce admin-only endpoints later
        additional_claims = {"role": user.role}

        # IMPORTANT: identity must be a string for PyJWT
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims=additional_claims,
            expires_delta=timedelta(hours=8),  # you can tweak this later
        )

        return {
            "access_token": access_token,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
            },
        }, 200


# ---------- /auth/logout ----------
class LogoutResource(Resource):
    @jwt_required()
    def post(self):
        # Stateless JWT: logout is handled on frontend by deleting token.
        # Later you can implement token blacklisting if you want.
        return {"message": "Logged out. Please discard the token on the client."}, 200


# ---------- /auth/request-reset ----------
class PasswordResetRequestResource(Resource):
    def post(self):
        """
        MVP version:
          - Accept email
          - If user exists, generate a short-lived reset token.
          - For now, return the token in the response (later you'll email it).
        """
        data = request.get_json() or {}
        email = data.get("email")

        if not email:
            return {"message": "Email is required"}, 400

        user = User.query.filter_by(email=email).first()

        # Always return 200, even if user does not exist
        # (avoids leaking which emails are registered)
        if not user:
            return {
                "message": "If that email exists, a reset token has been generated."
            }, 200

        # IMPORTANT: identity must be a string here as well
        reset_token = create_access_token(
            identity=str(user.id),
            additional_claims={"reset": True},  # mark as reset token
            expires_delta=timedelta(hours=1),
        )

        # TODO later: send reset_token via email instead of returning it
        return {
            "message": "Password reset token generated.",
            "reset_token": reset_token,
        }, 200


# ---------- /auth/reset-password ----------
class PasswordResetResource(Resource):
    def post(self):
        """
        Accepts JSON body:
            {
                "token": "<reset_token_here>",
                "new_password": "..."
            }
        """
        data = request.get_json() or {}
        token = data.get("token")
        new_password = data.get("new_password")

        # Basic validation
        if not token or not new_password:
            return {"message": "Token and new_password are required"}, 400

        # 1. Decode the token
        try:
            decoded = decode_token(token)
        except Exception as e:
            # If token is invalid or expired, you'll see why here
            return {"message": "Invalid or expired token", "error": str(e)}, 400

        # 2. Extract user_id (identity is stored in "sub" by default)
        user_id_str = decoded.get("sub")
        if not user_id_str:
            return {"message": "Invalid token payload: missing 'sub' (user id)"}, 400

        # Convert back to int (we stored it as string)
        try:
            user_id = int(user_id_str)
        except ValueError:
            return {"message": "Invalid token payload: 'sub' is not a valid integer"}, 400

        # 3. Ensure this is a reset token (we set additional_claims={"reset": True})
        is_reset = decoded.get("reset", False)
        if not is_reset:
            return {
                "message": "Invalid reset token: 'reset' claim missing or false",
                "decoded": decoded,  # TEMP: help debugging if needed
            }, 400

        # 4. Lookup user
        user = User.query.get(user_id)
        if not user:
            return {"message": "User not found"}, 404

        # 5. Update password
        user.set_password(new_password)
        db.session.commit()

        return {"message": "Password has been reset successfully."}, 200
