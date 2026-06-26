import os
from pathlib import Path
from dotenv import load_dotenv

# Load env variables from multiple locations to be absolutely sure
db_dir = Path(__file__).resolve().parent
backend_dir = db_dir.parent / "UI" / "backend"
root_dir = db_dir.parent

load_dotenv(dotenv_path=root_dir / ".env")
load_dotenv(dotenv_path=backend_dir / ".env")
load_dotenv(dotenv_path=db_dir / ".env")
load_dotenv()

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:postgres@localhost:5432/diabetes_prediction")
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

# SQLite fallback for easier developer setup / testing if Postgres is not running
SQLITE_FALLBACK = os.getenv("SQLITE_FALLBACK", "true").lower() in ("true", "1", "yes")
SQLITE_URL = "sqlite:///diabetes_prediction_fallback.db"

# Session settings
SESSION_TIMEOUT_MINUTES = int(os.getenv("SESSION_TIMEOUT_MINUTES", "30"))
SESSION_REMEMBER_ME_DAYS = int(os.getenv("SESSION_REMEMBER_ME_DAYS", "30"))

# Google OAuth 2.0 settings
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:5000/auth/google/callback")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
