"""Appointment endpoints."""
from datetime import date, time, datetime

from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity

from app import db
from app.models import Appointment, AppointmentStatus, AdminRole
from app.api.v1.utils import customer_required, admin_required, error_response, success_response

appointments_bp = Blueprint("appointments", __name__)


def _appt_dict(a: Appointment) -> dict:
    return {
        "id": a.id,
        "appointment_date": a.appointment_date.isoformat(),
        "appointment_time": a.appointment_time.isoformat(),
        "purpose": a.purpose,
        "notes": a.notes,
        "status": a.status.value,
        "admin_notes": a.admin_notes,
        "created_at": a.created_at.isoformat(),
    }


@appointments_bp.get("")
@customer_required
def list_appointments():
    cid = int(get_jwt_identity())
    appts = Appointment.query.filter_by(customer_id=cid).order_by(Appointment.appointment_date.desc()).all()
    return success_response([_appt_dict(a) for a in appts])


@appointments_bp.post("")
@customer_required
def create_appointment():
    cid = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    try:
        appt_date = date.fromisoformat(data["appointment_date"])
        appt_time = time.fromisoformat(data["appointment_time"])
    except (KeyError, ValueError):
        return error_response("VALIDATION_ERROR", "Valid appointment_date (YYYY-MM-DD) and appointment_time (HH:MM) are required.")

    appt = Appointment(
        customer_id=cid,
        appointment_date=appt_date,
        appointment_time=appt_time,
        purpose=data.get("purpose", "").strip() or None,
        notes=data.get("notes", "").strip() or None,
    )
    db.session.add(appt)
    db.session.commit()
    return success_response(_appt_dict(appt), 201)


@appointments_bp.post("/<int:appt_id>/cancel")
@customer_required
def cancel_appointment(appt_id):
    cid = int(get_jwt_identity())
    appt = Appointment.query.filter_by(id=appt_id, customer_id=cid).first()
    if not appt:
        return error_response("NOT_FOUND", "Appointment not found.", 404)
    if appt.status == AppointmentStatus.COMPLETED:
        return error_response("CANCEL_NOT_ALLOWED", "Completed appointments cannot be cancelled.", 422)
    appt.status = AppointmentStatus.CANCELLED
    db.session.commit()
    return success_response({"message": "Appointment cancelled."})


# Admin
@appointments_bp.get("/admin/all")
@admin_required()
def admin_list_appointments():
    appts = Appointment.query.order_by(Appointment.appointment_date.desc()).limit(200).all()
    return success_response([_appt_dict(a) for a in appts])


@appointments_bp.patch("/admin/<int:appt_id>/status")
@admin_required()
def admin_update_appointment(appt_id):
    appt = Appointment.query.get_or_404(appt_id)
    data = request.get_json(silent=True) or {}
    try:
        appt.status = AppointmentStatus(data.get("status", ""))
    except ValueError:
        return error_response("VALIDATION_ERROR", "Invalid status.")
    if "admin_notes" in data:
        appt.admin_notes = data["admin_notes"]
    db.session.commit()
    return success_response(_appt_dict(appt))
