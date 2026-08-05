"""Django settings for the Shpotify backend.

Configuration is intentionally small and reads secrets/toggles from a `.env`
file (see `.env.example`). The API is a stateless JWT-authenticated REST
service consumed by the Next.js frontend running on http://localhost:3000.
"""

import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from backend/.env if present.
load_dotenv(BASE_DIR / ".env")


def env_bool(name: str, default: bool) -> bool:
    """Read a boolean flag from the environment ('1', 'true', 'yes')."""
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


SECRET_KEY = os.getenv(
    "DJANGO_SECRET_KEY", "dev-insecure-key-change-me-in-production"
)
DEBUG = env_bool("DJANGO_DEBUG", True)
ALLOWED_HOSTS = os.getenv(
    "DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1"
).split(",")


# --- Applications ---------------------------------------------------------
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party.
    "rest_framework",
    "corsheaders",
    # Local apps.
    "apps.accounts",
    "apps.catalog",
    "apps.playlists",
    "apps.streaming",
    "apps.settings",
    "apps.subscriptions",
    "apps.support",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"


# --- Database -------------------------------------------------------------
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}


# --- Auth -----------------------------------------------------------------
AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation."
        "UserAttributeSimilarityValidator"
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 8},
    },
    {
        "NAME": "django.contrib.auth.password_validation."
        "CommonPasswordValidator"
    },
]


# --- Internationalization -------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True


# --- Static & media -------------------------------------------------------
STATIC_URL = "static/"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# --- Django REST Framework ------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ),
    "DEFAULT_PAGINATION_CLASS": (
        "rest_framework.pagination.PageNumberPagination"
    ),
    "PAGE_SIZE": 50,
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}


# --- CORS -----------------------------------------------------------------
# The Next.js dev server runs on localhost:3000 by default.
CORS_ALLOWED_ORIGINS = os.getenv(
    "CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
).split(",")
CORS_ALLOW_CREDENTIALS = True


# --- File upload limits ---------------------------------------------------
# Hard ceiling enforced by Django before our per-field validators run.
DATA_UPLOAD_MAX_MEMORY_SIZE = 25 * 1024 * 1024  # 25 MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 25 * 1024 * 1024  # 25 MB

# Per-field validation limits (used by apps.common.validators).
MAX_AUDIO_UPLOAD_SIZE = 20 * 1024 * 1024  # 20 MB
MAX_IMAGE_UPLOAD_SIZE = 2 * 1024 * 1024  # 2 MB
ALLOWED_AUDIO_EXTENSIONS = ["mp3", "wav", "m4a"]
ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png"]


# --- Payment gateway (Aqaye Pardakht) -------------------------------------
# In sandbox mode `pin` must be the literal string "sandbox".
PAYMENT_GATEWAY_PIN = os.getenv("PAYMENT_GATEWAY_PIN", "sandbox")
# "sandbox" hits the real Aqaye Pardakht sandbox over the network; "simulate"
# short-circuits the HTTP calls so the full checkout flow can be exercised
# offline during development. Never use "simulate" in production.
PAYMENT_GATEWAY_MODE = os.getenv("PAYMENT_GATEWAY_MODE", "sandbox")
PAYMENT_GATEWAY_TIMEOUT = int(os.getenv("PAYMENT_GATEWAY_TIMEOUT", "20"))
PAYMENT_GATEWAY_CREATE_URL = os.getenv(
    "PAYMENT_GATEWAY_CREATE_URL",
    "https://panel.aqayepardakht.ir/api/v2/create",
)
PAYMENT_GATEWAY_VERIFY_URL = os.getenv(
    "PAYMENT_GATEWAY_VERIFY_URL",
    "https://panel.aqayepardakht.ir/api/v2/verify",
)
PAYMENT_GATEWAY_STARTPAY_URL = os.getenv(
    "PAYMENT_GATEWAY_STARTPAY_URL",
    "https://panel.aqayepardakht.ir/startpay/sandbox",
)
# Where the gateway redirects the browser after payment. Points at the backend
# callback view, which then forwards the user to the frontend result page.
PAYMENT_CALLBACK_URL = os.getenv(
    "PAYMENT_CALLBACK_URL", "http://127.0.0.1:8000/api/payments/callback/"
)
# Frontend base URL used to build success/failure redirect targets.
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")
