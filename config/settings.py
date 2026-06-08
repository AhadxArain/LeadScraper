import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ── API Keys ─────────────────────────────────────────────────────────────────
SERPER_API_KEY = os.getenv("SERPER_API_KEY", "")
BOUNCER_API_KEY = os.getenv("BOUNCER_API_KEY", "")

# ── Data Directory ────────────────────────────────────────────────────────────
DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)

VALID_LEADS_FILE    = DATA_DIR / "valid_leads.csv"
REJECTED_LEADS_FILE = DATA_DIR / "rejected_leads.csv"
EXISTING_LEADS_FILE = DATA_DIR / "already_existing_leads.csv"
RUN_LOGS_FILE       = DATA_DIR / "run_logs.csv"

# ── Serper Config ─────────────────────────────────────────────────────────────
SERPER_MAPS_URL          = "https://google.serper.dev/maps"
SERPER_RESULTS_PER_PAGE  = 10   # Serper maps returns up to 10 per page
MAX_PAGES                = 50   # Hard safety cap to prevent infinite loops

# ── Email Extractor ───────────────────────────────────────────────────────────
EMAIL_FETCH_TIMEOUT = 8  # seconds per website request

# ── CSV Column Schemas ────────────────────────────────────────────────────────
LEAD_COLUMNS = [
    "business_name", "phone", "email", "website",
    "address", "rating", "reviews",
    "business_type", "zip_code", "source_url", "scraped_at",
]

REJECTED_COLUMNS = LEAD_COLUMNS + ["rejection_reason"]

LOG_COLUMNS = [
    "run_id", "business_type", "zip_code",
    "requested_leads", "valid_leads_found",
    "rejected_count", "already_existing_count",
    "pages_scraped", "run_datetime",
]