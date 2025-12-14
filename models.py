# models.py
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import MetaData
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy_serializer import SerializerMixin
from datetime import datetime

naming_convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}
metadata = MetaData(naming_convention=naming_convention)

db = SQLAlchemy(metadata=metadata)
# Association table for many-to-many relationship between Group and Contact
group_contacts = db.Table(
    "group_contacts",
    db.Column(
        "group_id",
        db.Integer,
        db.ForeignKey("groups.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    db.Column(
        "contact_id",
        db.Integer,
        db.ForeignKey("contacts.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)
#USER MODEL
class User(db.Model, SerializerMixin):
    __tablename__ = "users"

    # Never serialize password_hash to avoid exposing it
    serialize_rules = ("-password_hash",)

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(128), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(
        db.Enum("user", "admin", name="user_roles"),
        default="user",
        nullable=False,
    )
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
    # One-to-many: User -> Contacts
    contacts = db.relationship(
        "Contact",
        backref="user",
        lazy=True,
        cascade="all, delete-orphan",
    )
    # One-to-many: User -> Groups
    groups = db.relationship(
        "Group",
        backref="user",
        lazy=True,
        cascade="all, delete-orphan",
    )
    # Password helpers
    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

# CONTACT MODEL
class Contact(db.Model, SerializerMixin):
    __tablename__ = "contacts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    name = db.Column(db.String(100))
    phone = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(128))
    is_opted_out = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    # Many-to-many with groups (explicit)
    groups = db.relationship(
        "Group",
        secondary=group_contacts,
        back_populates="contacts",
    )
# CONTACT MODEL
class Group(db.Model, SerializerMixin):
    __tablename__ = "groups"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    contacts = db.relationship(
        "Contact",
        secondary=group_contacts,
        back_populates="groups",
    )
