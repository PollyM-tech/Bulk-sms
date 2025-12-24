# resources/auth.py

from datetime import timedelta
from flask import request
from flask_restful import Resource
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    decode_token,
)
from sqlalchemy.exc import IntegrityError

from models import (
    db,
    ClientAccount,
    User,
)

class RegisterResource(Resource):
    def post(self):
        data = request.get_json() or {}
        company_name = data.get("company_name")
        email = data.get("email")
        password = data.get("password")
        phone = data.get("phone")

        if not company_name or not email or not password:
            return {"message": "company_name, email and password are required"}, 400

        try:
            client = ClientAccount(
                name=company_name,
                primary_email=email,
                phone=phone,
                status="active",
            )
            db.session.add(client)
            db.session.flush()

            user = User(
                client_account_id=client.id,
                email=email,
                role="admin",
                is_active=True,
            )
            user.set_password(password)

            db.session.add(user)
            db.session.commit()

        except IntegrityError:
            db.session.rollback()
            return {"message": "Email already registered"}, 400

        return {
            "message": "Account created successfully",
            "client_account": {
                "id": client.id,
                "name": client.name,
            },
            "user": {
                "id": user.id,
                "email": user.email,
                "role": user.role,
            },
        }, 201


class LoginResource(Resource):
    def post(self):
        data = request.get_json() or {}
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return {"message": "Email and password are required"}, 400

        user = User.query.filter_by(email=email).first()

        if not user or not user.check_password(password):
            return {"message": "Invalid email or password"}, 401

        if not user.is_active:
            return {"message": "User account is inactive"}, 403

        additional_claims = {
            "role": user.role,
            "client_account_id": user.client_account_id,
        }

        access_token = create_access_token(
            identity=str(user.id),
            additional_claims=additional_claims,
            expires_delta=timedelta(hours=8),
        )

        return {
            "access_token": access_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "role": user.role,
                "client_account_id": user.client_account_id,
            },
        }, 200


class LogoutResource(Resource):
    @jwt_required()
    def post(self):
        return {"message": "Logged out successfully"}, 200


class PasswordResetRequestResource(Resource):
    def post(self):
        data = request.get_json() or {}
        email = data.get("email")

        if not email:
            return {"message": "Email is required"}, 400

        user = User.query.filter_by(email=email).first()

        if not user:
            return {
                "message": "If the email exists, a reset token has been generated."
            }, 200

        reset_token = create_access_token(
            identity=str(user.id),
            additional_claims={"reset": True},
            expires_delta=timedelta(hours=1),
        )

        return {
            "message": "Password reset token generated",
            "reset_token": reset_token,
        }, 200


class PasswordResetResource(Resource):
    def post(self):
        data = request.get_json() or {}
        token = data.get("token")
        new_password = data.get("new_password")

        if not token or not new_password:
            return {"message": "token and new_password are required"}, 400

        try:
            decoded = decode_token(token)
        except Exception:
            return {"message": "Invalid or expired token"}, 400

        if not decoded.get("reset", False):
            return {"message": "Invalid reset token"}, 400

        user_id = decoded.get("sub")
        if not user_id:
            return {"message": "Invalid token payload"}, 400

        user = User.query.get(int(user_id))
        if not user:
            return {"message": "User not found"}, 404

        user.set_password(new_password)
        db.session.commit()

        return {"message": "Password reset successful"}, 200
