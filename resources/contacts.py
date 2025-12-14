# resources/contacts.py

from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import db, Contact


def _current_user_id():
    # identity is stored as string in JWT, so convert to int
    return int(get_jwt_identity())


# ---------- /contacts (list + create) ----------
class ContactListResource(Resource):
    @jwt_required()
    def get(self):
        user_id = _current_user_id()
        contacts = (
            Contact.query
            .filter_by(user_id=user_id)
            .order_by(Contact.created_at.desc())
            .all()
        )

        data = []
        for c in contacts:
            data.append({
                "id": c.id,
                "name": c.name,
                "phone": c.phone,
                "email": c.email,
                "is_opted_out": c.is_opted_out,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            })

        return data, 200

    @jwt_required()
    def post(self):
        user_id = _current_user_id()
        data = request.get_json() or {}

        name = data.get("name")
        phone = data.get("phone")
        email = data.get("email")

        if not phone:
            return {"message": "Phone is required"}, 400

        contact = Contact(
            user_id=user_id,
            name=name,
            phone=phone,
            email=email,
        )
        db.session.add(contact)
        db.session.commit()

        return {
            "id": contact.id,
            "name": contact.name,
            "phone": contact.phone,
            "email": contact.email,
            "is_opted_out": contact.is_opted_out,
        }, 201


# ---------- /contacts/<id> (retrieve, update, delete) ----------
class ContactResource(Resource):
    @jwt_required()
    def get(self, contact_id):
        user_id = _current_user_id()
        contact = Contact.query.filter_by(id=contact_id, user_id=user_id).first()
        if not contact:
            return {"message": "Contact not found"}, 404

        return {
            "id": contact.id,
            "name": contact.name,
            "phone": contact.phone,
            "email": contact.email,
            "is_opted_out": contact.is_opted_out,
        }, 200

    @jwt_required()
    def put(self, contact_id):
        user_id = _current_user_id()
        contact = Contact.query.filter_by(id=contact_id, user_id=user_id).first()
        if not contact:
            return {"message": "Contact not found"}, 404

        data = request.get_json() or {}
        contact.name = data.get("name", contact.name)
        contact.phone = data.get("phone", contact.phone)
        contact.email = data.get("email", contact.email)

        db.session.commit()

        return {
            "id": contact.id,
            "name": contact.name,
            "phone": contact.phone,
            "email": contact.email,
            "is_opted_out": contact.is_opted_out,
        }, 200

    @jwt_required()
    def delete(self, contact_id):
        user_id = _current_user_id()
        contact = Contact.query.filter_by(id=contact_id, user_id=user_id).first()
        if not contact:
            return {"message": "Contact not found"}, 404

        db.session.delete(contact)
        db.session.commit()

        return {"message": "Contact deleted"}, 200


# ---------- /contacts/<id>/opt-out ----------
class ContactOptOutResource(Resource):
    @jwt_required()
    def post(self, contact_id):
        """
        Body:
        {
          "opted_out": true/false
        }
        """
        user_id = _current_user_id()
        contact = Contact.query.filter_by(id=contact_id, user_id=user_id).first()
        if not contact:
            return {"message": "Contact not found"}, 404

        data = request.get_json() or {}
        opted_out = data.get("opted_out", True)

        contact.is_opted_out = bool(opted_out)
        db.session.commit()

        return {
            "id": contact.id,
            "is_opted_out": contact.is_opted_out,
        }, 200
