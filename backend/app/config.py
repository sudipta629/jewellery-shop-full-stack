"""
Application configuration classes.

Usage:
    from app.config import config_map
    app.config.from_object(config_map["development"])
"""
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class BaseConfig:
    """Shared settings for all environments."""

    # Flask
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "dev-secret-change-me")

    # SQLAlchemy
    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False
    SQLALCHEMY_ENGINE_OPTIONS: dict = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }

    # JWT
    JWT_SECRET_KEY: str = os.environ.get("JWT_SECRET_KEY", "jwt-dev-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        seconds=int(os.environ.get("JWT_ACCESS_TOKEN_EXPIRES", 3600))
    )
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(
        seconds=int(os.environ.get("JWT_REFRESH_TOKEN_EXPIRES", 2592000))
    )
    JWT_TOKEN_LOCATION: list = ["headers"]
    JWT_HEADER_NAME: str = "Authorization"
    JWT_HEADER_TYPE: str = "Bearer"


    # CORS
    CORS_ORIGINS: list = [
        o.strip()
        for o in os.environ.get(
            "CORS_ORIGINS", "http://localhost:5173,http://localhost:5174"
        ).split(",")
        if o.strip()
    ]

    # File uploads
    STORAGE_BACKEND: str = os.environ.get("STORAGE_BACKEND", "local")
    UPLOAD_FOLDER: str = os.path.abspath(
        os.environ.get("UPLOAD_FOLDER", "uploads")
    )
    MAX_CONTENT_LENGTH: int = int(
        os.environ.get("MAX_CONTENT_LENGTH", 10 * 1024 * 1024)
    )

    # Mail
    MAIL_SERVER: str = os.environ.get("MAIL_SERVER", "")
    MAIL_PORT: int = int(os.environ.get("MAIL_PORT", 587))
    MAIL_USE_TLS: bool = os.environ.get("MAIL_USE_TLS", "true").lower() == "true"
    MAIL_USERNAME: str = os.environ.get("MAIL_USERNAME", "")
    MAIL_PASSWORD: str = os.environ.get("MAIL_PASSWORD", "")
    MAIL_DEFAULT_SENDER: str = os.environ.get("MAIL_DEFAULT_SENDER", "")

    # Redis (optional)
    REDIS_URL: str = os.environ.get("REDIS_URL", "redis://localhost:6379/0")


class DevelopmentConfig(BaseConfig):
    DEBUG: bool = True
    SQLALCHEMY_DATABASE_URI: str = os.environ.get(
        "DATABASE_URL",
        "sqlite:///jewellery_dev.db",
    )


class ProductionConfig(BaseConfig):
    DEBUG: bool = False
    SQLALCHEMY_DATABASE_URI: str = os.environ.get("DATABASE_URL", "")

    # Render PostgreSQL uses postgres:// URI — SQLAlchemy+psycopg2 needs postgresql+psycopg2://
    @classmethod
    def _fix_db_uri(cls) -> str:
        uri = os.environ.get("DATABASE_URL", "")
        if uri.startswith("postgres://"):
            uri = uri.replace("postgres://", "postgresql+psycopg2://", 1)
        elif uri.startswith("postgresql://") and "+" not in uri.split("://")[0]:
            uri = uri.replace("postgresql://", "postgresql+psycopg2://", 1)
        return uri

    def __init__(self):
        self.SQLALCHEMY_DATABASE_URI = self._fix_db_uri()


class TestingConfig(BaseConfig):
    TESTING: bool = True
    SQLALCHEMY_DATABASE_URI: str = os.environ.get(
        "TEST_DATABASE_URL",
        "postgresql+psycopg2://postgres:postgres@localhost:5432/jewellery_test",
    )
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=5)


config_map: dict = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
    "default": DevelopmentConfig,
}
