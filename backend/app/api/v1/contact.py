"""Contact form endpoint."""
from flask import Blueprint, request

from app import db
from app.models import ContactMessage, ContactStatus, AdminRole
from app.api.v1.utils import admin_required, error_response, success_response

contact_bp = Blueprint("contact", __name__)


@contact_bp.post("")
def submit_contact():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    message = (data.get("message") or "").strip()

    if not name or not email or not message:
        return error_response("VALIDATION_ERROR", "name, email, and message are required.")

    if "@" not in email:
        return error_response("VALIDATION_ERROR", "Invalid email address.")

    msg = ContactMessage(
        name=name,
        email=email,
        phone=(data.get("phone") or "").strip() or None,
        message=message,
    )
    db.session.add(msg)
    db.session.commit()
    return success_response({"message": "Your message has been received. We'll be in touch soon."}, 201)


@contact_bp.get("")
@admin_required()
def list_messages():
    status_filter = request.args.get("status")
    query = ContactMessage.query.order_by(ContactMessage.created_at.desc())
    if status_filter:
        try:
            query = query.filter_by(status=ContactStatus(status_filter))
        except ValueError:
            pass
    msgs = query.limit(200).all()
    return success_response([
        {
            "id": m.id,
            "name": m.name,
            "email": m.email,
            "phone": m.phone,
            "message": m.message,
            "status": m.status.value,
            "created_at": m.created_at.isoformat(),
        }
        for m in msgs
    ])


@contact_bp.patch("/<int:msg_id>/status")
@admin_required()
def update_message_status(msg_id):
    msg = ContactMessage.query.get_or_404(msg_id)
    data = request.get_json(silent=True) or {}
    try:
        msg.status = ContactStatus(data.get("status", "read"))
    except ValueError:
        return error_response("VALIDATION_ERROR", "Invalid status.")
    db.session.commit()
    return success_response({"message": "Status updated."})
