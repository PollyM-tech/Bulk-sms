# resources/groups.py

from flask import request
from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import db, Group, Contact


def _current_user_id():
    return int(get_jwt_identity())


# ---------- /groups (list + create) ----------
class GroupListResource(Resource):
    @jwt_required()
    def get(self):
        user_id = _current_user_id()
        groups = (
            Group.query
            .filter_by(user_id=user_id)
            .order_by(Group.created_at.desc())
            .all()
        )

        data = []
        for g in groups:
            data.append({
                "id": g.id,
                "name": g.name,
                "description": g.description,
                "created_at": g.created_at.isoformat() if g.created_at else None,
                "contacts_count": len(g.contacts),
            })

        return data, 200

    @jwt_required()
    def post(self):
        user_id = _current_user_id()
        data = request.get_json() or {}

        name = data.get("name")
        description = data.get("description")

        if not name:
            return {"message": "Group name is required"}, 400

        group = Group(
            user_id=user_id,
            name=name,
            description=description,
        )
        db.session.add(group)
        db.session.commit()

        return {
            "id": group.id,
            "name": group.name,
            "description": group.description,
        }, 201


# ---------- /groups/<id> (retrieve, update, delete) ----------
class GroupResource(Resource):
    @jwt_required()
    def get(self, group_id):
        user_id = _current_user_id()
        group = Group.query.filter_by(id=group_id, user_id=user_id).first()
        if not group:
            return {"message": "Group not found"}, 404

        contacts_data = []
        for c in group.contacts:
            contacts_data.append({
                "id": c.id,
                "name": c.name,
                "phone": c.phone,
                "email": c.email,
                "is_opted_out": c.is_opted_out,
            })

        return {
            "id": group.id,
            "name": group.name,
            "description": group.description,
            "contacts": contacts_data,
        }, 200

    @jwt_required()
    def put(self, group_id):
        user_id = _current_user_id()
        group = Group.query.filter_by(id=group_id, user_id=user_id).first()
        if not group:
            return {"message": "Group not found"}, 404

        data = request.get_json() or {}
        group.name = data.get("name", group.name)
        group.description = data.get("description", group.description)

        db.session.commit()

        return {
            "id": group.id,
            "name": group.name,
            "description": group.description,
        }, 200

    @jwt_required()
    def delete(self, group_id):
        user_id = _current_user_id()
        group = Group.query.filter_by(id=group_id, user_id=user_id).first()
        if not group:
            return {"message": "Group not found"}, 404

        db.session.delete(group)
        db.session.commit()

        return {"message": "Group deleted"}, 200


# ---------- /groups/<id>/contacts (add multiple contacts) ----------
class GroupContactsResource(Resource):
    @jwt_required()
    def post(self, group_id):
        """
        Body:
        {
          "contact_ids": [1, 2, 3]
        }
        """
        user_id = _current_user_id()
        group = Group.query.filter_by(id=group_id, user_id=user_id).first()
        if not group:
            return {"message": "Group not found"}, 404

        data = request.get_json() or {}
        contact_ids = data.get("contact_ids", [])

        if not isinstance(contact_ids, list) or not contact_ids:
            return {"message": "contact_ids must be a non-empty list"}, 400

        contacts = Contact.query.filter(
            Contact.id.in_(contact_ids),
            Contact.user_id == user_id
        ).all()

        for c in contacts:
            if c not in group.contacts:
                group.contacts.append(c)

        db.session.commit()

        return {
            "id": group.id,
            "name": group.name,
            "contacts_count": len(group.contacts),
        }, 200


# ---------- /groups/<id>/contacts/<contact_id> (remove one contact) ----------
class GroupContactItemResource(Resource):
    @jwt_required()
    def delete(self, group_id, contact_id):
        user_id = _current_user_id()
        group = Group.query.filter_by(id=group_id, user_id=user_id).first()
        if not group:
            return {"message": "Group not found"}, 404

        contact = Contact.query.filter_by(id=contact_id, user_id=user_id).first()
        if not contact:
            return {"message": "Contact not found"}, 404

        if contact in group.contacts:
            group.contacts.remove(contact)
            db.session.commit()

        return {"message": "Contact removed from group"}, 200
