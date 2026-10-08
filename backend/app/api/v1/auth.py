"""
Customer authentication endpoints.

POST /api/v1/auth/request-otp   — request OTP for login/register
POST /api/v1/auth/verify-otp    — verify OTP and receive tokens
POST /api/v1/auth/refresh        — refresh access token
POST /api/v1/auth/logout         — logout (client should discard tokens)
GET  /api/v1/auth/me             — get current customer profile
"""
import hashlib
import random
import string
from datetime import datetime, timedelta, timezone

from flask import Blueprint, request, current_app
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
)

from app import db
from app.models import Customer, OTP, OtpChannel, OtpPurpose
from app.api.v1.utils import customer_required, error_response, success_response
from app.services.mail_service import send_otp_email

auth_bp = Blueprint("auth", __name__)

OTP_EXPIRY_MINUTES = 10
OTP_MAX_ATTEMPTS = 5
OTP_RESEND_COOLDOWN_SECONDS = 60
OTP_LENGTH = 6


def _generate_otp() -> str:
    return "".join(random.choices(string.digits, k=OTP_LENGTH))


def _hash_otp(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


def _make_customer_claims(customer: Customer) -> dict:
    return {"type": "customer"}


# ---------------------------------------------------------------------------
# Request OTP
# ---------------------------------------------------------------------------

@auth_bp.post("/request-otp")
def request_otp():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    purpose_raw = (data.get("purpose") or "login").strip()

    if not email:
        return error_response("VALIDATION_ERROR", "email is required.")

    try:
        purpose = OtpPurpose(purpose_raw)
    except ValueError:
        return error_response("VALIDATION_ERROR", f"Invalid purpose '{purpose_raw}'.")

    now = datetime.now(timezone.utc).replace(tzinfo=None)

    # Resend cooldown — check if a recent non-expired OTP exists
    recent = (
        OTP.query
        .filter_by(contact=email, purpose=purpose, channel=OtpChannel.EMAIL, is_used=False)
        .order_by(OTP.created_at.desc())
        .first()
    )
    if recent:
        cooldown_until = recent.created_at.replace(tzinfo=None) + timedelta(seconds=OTP_RESEND_COOLDOWN_SECONDS)
        if now < cooldown_until:
            seconds_left = int((cooldown_until - now).total_seconds())
            return error_response(
                "COOLDOWN",
                f"Please wait {seconds_left}s before requesting another OTP.",
                429,
            )

    code = _generate_otp()
    code_hash = _hash_otp(code)
    expires_at = now + timedelta(minutes=OTP_EXPIRY_MINUTES)

    # Invalidate all previous unused OTPs for this contact+purpose
    OTP.query.filter_by(
        contact=email, purpose=purpose, channel=OtpChannel.EMAIL, is_used=False
    ).update({"is_used": True})

    otp_record = OTP(
        contact=email,
        channel=OtpChannel.EMAIL,
        purpose=purpose,
        code_hash=code_hash,
        expires_at=expires_at,
    )
    db.session.add(otp_record)
    db.session.commit()

    # Send email — if mail is not configured, this raises and returns an honest error
    try:
        send_otp_email(email, code, purpose)
    except Exception as exc:
        current_app.logger.error("OTP email failed: %s", exc)
        return error_response(
            "MAIL_NOT_CONFIGURED",
            "Email delivery failed. Please configure SMTP settings. See .env.example.",
            503,
        )

    return success_response({"message": "OTP sent to your email.", "expires_in_minutes": OTP_EXPIRY_MINUTES})


# ---------------------------------------------------------------------------
# Verify OTP
# ---------------------------------------------------------------------------

@auth_bp.post("/verify-otp")
def verify_otp():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    code = (data.get("code") or "").strip()
    purpose_raw = (data.get("purpose") or "login").strip()

    if not email or not code:
        return error_response("VALIDATION_ERROR", "email and code are required.")

    try:
        purpose = OtpPurpose(purpose_raw)
    except ValueError:
        return error_response("VALIDATION_ERROR", f"Invalid purpose '{purpose_raw}'.")

    now = datetime.now(timezone.utc).replace(tzinfo=None)

    otp_record = (
        OTP.query
        .filter_by(contact=email, purpose=purpose, channel=OtpChannel.EMAIL, is_used=False)
        .order_by(OTP.created_at.desc())
        .first()
    )

    if not otp_record:
        return error_response("INVALID_OTP", "No active OTP found. Please request a new one.", 401)

    if now > otp_record.expires_at.replace(tzinfo=None):
        otp_record.is_used = True
        db.session.commit()
        return error_response("OTP_EXPIRED", "OTP has expired. Please request a new one.", 401)

    if otp_record.attempts >= OTP_MAX_ATTEMPTS:
        otp_record.is_used = True
        db.session.commit()
        return error_response("OTP_LOCKED", "Too many failed attempts. Please request a new OTP.", 429)

    if otp_record.code_hash != _hash_otp(code):
        otp_record.attempts += 1
        db.session.commit()
        remaining = OTP_MAX_ATTEMPTS - otp_record.attempts
        return error_response("INVALID_OTP", f"Invalid OTP. {remaining} attempt(s) remaining.", 401)

    # OTP is valid — mark as used
    otp_record.is_used = True
    db.session.commit()

    # Create or fetch customer
    customer = Customer.query.filter_by(email=email).first()
    if not customer:
        customer = Customer(email=email, is_email_verified=True)
        db.session.add(customer)
    else:
        customer.is_email_verified = True
    customer.last_login_at = now
    db.session.commit()

    additional_claims = _make_customer_claims(customer)
    access_token = create_access_token(
        identity=str(customer.id),
        additional_claims=additional_claims,
    )
    refresh_token = create_refresh_token(
        identity=str(customer.id),
        additional_claims=additional_claims,
    )

    return success_response({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "customer": {
            "id": customer.id,
            "email": customer.email,
            "full_name": customer.full_name,
            "is_email_verified": customer.is_email_verified,
        },
    })


# ---------------------------------------------------------------------------
# Refresh
# ---------------------------------------------------------------------------

@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    customer = Customer.query.get(int(identity))
    if not customer or not customer.is_active:
        return error_response("UNAUTHORIZED", "Account not found or deactivated.", 401)

    access_token = create_access_token(
        identity=identity,
        additional_claims=_make_customer_claims(customer),
    )
    return success_response({"access_token": access_token})


# ---------------------------------------------------------------------------
# Logout (client-side — instruct to discard tokens)
# ---------------------------------------------------------------------------

@auth_bp.post("/logout")
def logout():
    # JWT is stateless. Client must discard tokens.
    # For production add token blocklist using Redis.
    return success_response({"message": "Logged out successfully."})


# ---------------------------------------------------------------------------
# Me
# ---------------------------------------------------------------------------

@auth_bp.get("/me")
@customer_required
def me():
    identity = get_jwt_identity()
    customer = Customer.query.get(int(identity))
    if not customer:
        return error_response("NOT_FOUND", "Customer not found.", 404)

    return success_response({
        "id": customer.id,
        "email": customer.email,
        "phone": customer.phone,
        "full_name": customer.full_name,
        "is_email_verified": customer.is_email_verified,
        "is_phone_verified": customer.is_phone_verified,
        "is_active": customer.is_active,
        "created_at": customer.created_at.isoformat(),
        "last_login_at": customer.last_login_at.isoformat() if customer.last_login_at else None,
    })
