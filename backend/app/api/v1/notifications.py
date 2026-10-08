"""Notification endpoints."""
from flask import Blueprint
from flask_jwt_extended import get_jwt_identity

from app import db
from app.models import Notification
from app.api.v1.utils import customer_required, success_response

notifications_bp = Blueprint("notifications", __name__)


@notifications_bp.get("")
@customer_required
def list_notifications():
    cid = int(get_jwt_identity())
    notifs = (
        Notification.query
        .filter_by(customer_id=cid)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )
    unread_count = Notification.query.filter_by(customer_id=cid, is_read=False).count()
    return success_response({
        "unread_count": unread_count,
        "notifications": [
            {
                "id": n.id,
                "type": n.notification_type.value,
                "title": n.title,
                "message": n.message,
                "is_read": n.is_read,
                "reference_id": n.reference_id,
                "reference_type": n.reference_type,
                "created_at": n.created_at.isoformat(),
            }
            for n in notifs
        ],
    })


@notifications_bp.patch("/<int:notif_id>/read")
@customer_required
def mark_read(notif_id):
    cid = int(get_jwt_identity())
    n = Notification.query.filter_by(id=notif_id, customer_id=cid).first()
    if n:
        n.is_read = True
        db.session.commit()
    return success_response({"message": "Marked as read."})


@notifications_bp.patch("/read-all")
@customer_required
def mark_all_read():
    cid = int(get_jwt_identity())
    Notification.query.filter_by(customer_id=cid, is_read=False).update({"is_read": True})
    db.session.commit()
    return success_response({"message": "All notifications marked as read."})
