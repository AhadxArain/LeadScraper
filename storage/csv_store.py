import pandas as pd
from pathlib import Path
from typing import List
from filelock import FileLock

from config.settings import (
    VALID_LEADS_FILE, REJECTED_LEADS_FILE,
    EXISTING_LEADS_FILE, RUN_LOGS_FILE,
    LEAD_COLUMNS, REJECTED_COLUMNS, LOG_COLUMNS,
)


def load_csv(filepath: Path, columns: List[str]) -> pd.DataFrame:
    """
    Load a CSV safely. Returns an empty DataFrame with correct schema
    if the file does not exist or is empty/corrupt.
    """
    if filepath.exists() and filepath.stat().st_size > 0:
        try:
            return pd.read_csv(str(filepath), dtype=str, on_bad_lines="skip").fillna("")
        except Exception as e:
            print(f"[load_csv] error reading {filepath}: {e}")
    return pd.DataFrame(columns=columns)


def append_to_csv(filepath: Path, rows: List[dict], columns: List[str]) -> None:
    """Append rows to CSV with file lock to prevent concurrent-write corruption."""
    if not rows:
        return
    df = pd.DataFrame(rows)
    for col in columns:
        if col not in df.columns:
            df[col] = ""
    df = df[columns]
    lock = FileLock(str(filepath) + ".lock")
    with lock:
        write_header = not filepath.exists() or filepath.stat().st_size == 0
        df.to_csv(filepath, mode="a", header=write_header, index=False)


# ── Convenience loaders used by Streamlit UI ─────────────────────────────────

def load_valid_leads() -> pd.DataFrame:
    return load_csv(VALID_LEADS_FILE, LEAD_COLUMNS)

def load_rejected_leads() -> pd.DataFrame:
    return load_csv(REJECTED_LEADS_FILE, REJECTED_COLUMNS)

def load_existing_leads() -> pd.DataFrame:
    return load_csv(EXISTING_LEADS_FILE, LEAD_COLUMNS)

def load_run_logs() -> pd.DataFrame:
    return load_csv(RUN_LOGS_FILE, LOG_COLUMNS)

def load_all_time_unique_leads() -> pd.DataFrame:
    """
    Load valid_leads.csv, deduplicate by (business_name, phone),
    sort by scraped_at descending, return clean DataFrame.
    This gives a master view of every unique business ever found.
    """
    df = load_valid_leads()
    if df.empty:
        return df
    
    # Normalize for dedup: lowercase + strip non-alphanumeric
    df["_name_key"] = df["business_name"].str.lower().str.replace(
        r"[^a-z0-9]", "", regex=True
    )
    df["_phone_key"] = df["phone"].str.replace(
        r"[^0-9]", "", regex=True
    )
    
    # Keep first occurrence (earliest scrape) per unique business
    df = df.drop_duplicates(subset=["_name_key"], keep="first")
    
    # Drop helper columns
    df = df.drop(columns=["_name_key", "_phone_key"])
    
    # Sort newest first
    if "scraped_at" in df.columns:
        df = df.sort_values("scraped_at", ascending=False)
    
    return df.reset_index(drop=True)

def clear_all_data() -> None:
    """Delete all CSV data files to reset the application state."""
    for filepath in [VALID_LEADS_FILE, REJECTED_LEADS_FILE, EXISTING_LEADS_FILE, RUN_LOGS_FILE]:
        if filepath.exists():
            try:
                filepath.unlink()
            except OSError:
                pass

def overwrite_csv(filepath: Path, df: pd.DataFrame) -> None:
    """Overwrite an existing CSV file with a new DataFrame."""
    if df.empty:
        if filepath.exists():
            filepath.unlink()
    else:
        df.to_csv(filepath, index=False)