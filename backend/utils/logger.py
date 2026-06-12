import uuid
from datetime import datetime

from config.settings import RUN_LOGS_FILE, LOG_COLUMNS
from storage.csv_store import append_to_csv


def log_run(
    business_type: str,
    zip_code: str,
    requested_leads: int,
    valid_count: int,
    rejected_count: int,
    existing_count: int,
    pages_scraped: int,
) -> str:
    """
    Write one row to run_logs.csv summarising this scraping session.
    Returns the generated run_id (8-char uppercase hex) for display in the UI.
    """
    run_id = str(uuid.uuid4())[:8].upper()
    row = {
        "run_id":                run_id,
        "business_type":         business_type,
        "zip_code":              zip_code,
        "requested_leads":       requested_leads,
        "valid_leads_found":     valid_count,
        "rejected_count":        rejected_count,
        "already_existing_count": existing_count,
        "pages_scraped":         pages_scraped,
        "run_datetime":          datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }
    append_to_csv(RUN_LOGS_FILE, [row], LOG_COLUMNS)
    return run_id