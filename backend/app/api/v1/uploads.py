"""File upload endpoint."""
import os
import uuid
from werkzeug.utils import secure_filename
from flask import Blueprint, request, current_app, url_for

from app.api.v1.utils import admin_required, error_response, success_response

uploads_bp = Blueprint("uploads", __name__)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif"}


def _allowed(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@uploads_bp.post("/image")
@admin_required()
def upload_image():
    """
    Upload a product/category/banner image.
    Returns the URL of the stored image.

    Storage backend: configured via STORAGE_BACKEND env var.
    Currently supports 'local'. Extend for S3/Cloudinary.
    """
    if "file" not in request.files:
        return error_response("VALIDATION_ERROR", "No file part in request.")

    file = request.files["file"]
    if not file.filename:
        return error_response("VALIDATION_ERROR", "No file selected.")

    if not _allowed(file.filename):
        return error_response(
            "INVALID_FILE_TYPE",
            f"Allowed types: {', '.join(ALLOWED_EXTENSIONS)}",
            415,
        )

    upload_folder = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_folder, exist_ok=True)

    ext = file.filename.rsplit(".", 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    safe_filename = secure_filename(filename)
    filepath = os.path.join(upload_folder, safe_filename)
    file.save(filepath)

    # Build public URL — in production replace with CDN/S3 URL
    base_url = request.host_url.rstrip("/")
    url = f"{base_url}/uploads/{safe_filename}"

    return success_response({"url": url, "filename": safe_filename}, 201)
