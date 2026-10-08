"""
Application factory — creates and configures the Flask app.
"""
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS

# ---------------------------------------------------------------------------
# Extension instances (no app bound yet — initialised in create_app)
# ---------------------------------------------------------------------------
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()


def create_app(config_name: str = "development") -> Flask:
    """Create and return a configured Flask application instance."""
    app = Flask(__name__)

    # -----------------------------------------------------------------------
    # Configuration
    # -----------------------------------------------------------------------
    from app.config import config_map
    app.config.from_object(config_map[config_name])

    # -----------------------------------------------------------------------
    # Extensions
    # -----------------------------------------------------------------------
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # CORS — origins loaded from config
    CORS(
        app,
        origins=app.config["CORS_ORIGINS"],
        supports_credentials=True,
    )

    # -----------------------------------------------------------------------
    # Import models so Flask-Migrate can see them
    # -----------------------------------------------------------------------
    from app import models  # noqa: F401

    # -----------------------------------------------------------------------
    # Blueprints
    # -----------------------------------------------------------------------
    from app.api.v1 import api_v1_blueprint
    app.register_blueprint(api_v1_blueprint, url_prefix="/api/v1")

    # -----------------------------------------------------------------------
    # Health-check endpoint (no auth required)
    # -----------------------------------------------------------------------
    @app.get("/health")
    def health():
        return {"status": "ok", "version": "1.0.0"}

    # -----------------------------------------------------------------------
    # CLI commands
    # -----------------------------------------------------------------------
    from app.commands import register_commands
    register_commands(app)

    # -----------------------------------------------------------------------
    # Serve uploaded files in development
    # (In production, serve from nginx / CDN / S3)
    # -----------------------------------------------------------------------
    import os
    from flask import send_from_directory

    @app.route("/uploads/<path:filename>")
    def serve_upload(filename):
        upload_folder = app.config["UPLOAD_FOLDER"]
        return send_from_directory(upload_folder, filename)

    return app
