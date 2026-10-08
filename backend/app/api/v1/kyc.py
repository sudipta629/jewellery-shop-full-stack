"""KYC endpoints."""
from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity

from app import db
from app.models import KYC, KYCStatus, AdminRole
from app.api.v1.utils import customer_required, admin_required, error_response, success_response

kyc_bp = Blueprint("kyc", __name__)


def _kyc_dict(k: KYC, admin_view: bool = False) -> dict:
    data = {
        "id": k.id,
        "customer_id": k.customer_id,
        "document_type": k.document_type,
        "status": k.status.value,
        "submitted_at": k.submitted_at.isoformat(),
        "reviewed_at": k.reviewed_at.isoformat() if k.reviewed_at else None,
    }
    if admin_view:
        data["document_number"] = k.document_number
        data["document_front_url"] = k.document_front_url
        data["document_back_url"] = k.document_back_url
        data["review_notes"] = k.review_notes
    return data


@kyc_bp.get("")
@customer_required
def get_my_kyc():
    cid = int(get_jwt_identity())
    kyc = KYC.query.filter_by(customer_id=cid).first()
    if not kyc:
        return success_response(None)
    return success_response(_kyc_dict(kyc))


@kyc_bp.post("")
@customer_required
def submit_kyc():
    cid = int(get_jwt_identity())
    existing = KYC.query.filter_by(customer_id=cid).first()
    if existing and existing.status == KYCStatus.APPROVED:
        return error_response("CONFLICT", "KYC is already approved.", 409)

    data = request.get_json(silent=True) or {}
    doc_type = (data.get("document_type") or "").strip()
    doc_number = (data.get("document_number") or "").strip()
    front_url = (data.get("document_front_url") or "").strip()

    if not doc_type or not doc_number or not front_url:
        return error_response("VALIDATION_ERROR", "document_type, document_number, and document_front_url are required.")

    if existing:
        existing.document_type = doc_type
        existing.document_number = doc_number
        existing.document_front_url = front_url
        existing.document_back_url = data.get("document_back_url", "").strip() or None
        existing.status = KYCStatus.PENDING
        existing.review_notes = None
        db.session.commit()
        return success_response(_kyc_dict(existing))

    kyc = KYC(
        customer_id=cid,
        document_type=doc_type,
        document_number=doc_number,
        document_front_url=front_url,
        document_back_url=data.get("document_back_url", "").strip() or None,
    )
    db.session.add(kyc)
    db.session.commit()
    return success_response(_kyc_dict(kyc), 201)


@kyc_bp.get("/admin/all")
@admin_required()
def admin_list_kyc():
    status_filter = request.args.get("status")
    query = KYC.query.order_by(KYC.submitted_at.desc())
    if status_filter:
        try:
            query = query.filter_by(status=KYCStatus(status_filter))
        except ValueError:
            pass
    records = query.limit(200).all()
    return success_response([_kyc_dict(k, admin_view=True) for k in records])


@kyc_bp.patch("/admin/<int:kyc_id>/review")
@admin_required(allowed_roles=[AdminRole.SUPER_ADMIN, AdminRole.ADMIN])
def review_kyc(kyc_id):
    from datetime import datetime, timezone
    kyc = KYC.query.get_or_404(kyc_id)
    data = request.get_json(silent=True) or {}
    admin_id = int(get_jwt_identity())
    try:
        kyc.status = KYCStatus(data.get("status", ""))
    except ValueError:
        return error_response("VALIDATION_ERROR", "Invalid status.")
    kyc.review_notes = data.get("review_notes", "").strip() or None
    kyc.reviewed_by_admin_id = admin_id
    kyc.reviewed_at = datetime.now(timezone.utc)
    db.session.commit()
    return success_response(_kyc_dict(kyc, admin_view=True))
