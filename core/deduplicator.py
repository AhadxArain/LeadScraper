import re
import pandas as pd
from typing import Set, Tuple


def _normalize(value: str) -> str:
    """
    Reduce a string to lowercase alphanumeric for fuzzy key matching.
    'Pizza Palace LLC' → 'pizzapalacellc'
    '+1 (800) 555-1234' → '18005551234'
    """
    return re.sub(r"[^a-z0-9]", "", str(value).lower())


def build_existing_keys(df: pd.DataFrame) -> Set[Tuple[str, str]]:
    """
    Build a set of (normalized_name, normalized_phone) tuples from
    a DataFrame of already-saved leads. Used for O(1) duplicate lookup.
    """
    keys: Set[Tuple[str, str]] = set()
    for _, row in df.iterrows():
        name  = _normalize(row.get("business_name", ""))
        phone = _normalize(row.get("phone", ""))
        if name:  # name alone is the anchor; phone can be empty in edge cases
            keys.add((name, phone))
    return keys


def is_duplicate(lead: dict, existing_keys: Set[Tuple[str, str]]) -> bool:
    """Return True if this lead already exists in the keyset."""
    name  = _normalize(lead.get("business_name", ""))
    phone = _normalize(lead.get("phone", ""))
    return (name, phone) in existing_keys


def build_existing_email_keys(df: pd.DataFrame) -> Set[Tuple[str, str]]:
    """
    Build a set of (normalized_name, email_lower) tuples.
    """
    keys: Set[Tuple[str, str]] = set()
    for _, row in df.iterrows():
        name  = _normalize(row.get("business_name", ""))
        email = str(row.get("email", "")).strip().lower()
        if name and email:
            keys.add((name, email))
    return keys


def is_email_duplicate(lead: dict, existing_email_keys: Set[Tuple[str, str]]) -> bool:
    """Return True if this lead's business name + email already exists."""
    name  = _normalize(lead.get("business_name", ""))
    email = str(lead.get("email", "")).strip().lower()
    if not email:
        return False
    return (name, email) in existing_email_keys


def register_lead(lead: dict, existing_keys: Set[Tuple[str, str]], existing_email_keys: Set[Tuple[str, str]] = None) -> None:
    """
    Add a newly accepted lead's keys to the sets.
    """
    name  = _normalize(lead.get("business_name", ""))
    phone = _normalize(lead.get("phone", ""))
    email = str(lead.get("email", "")).strip().lower()
    
    if name:
        existing_keys.add((name, phone))
        if existing_email_keys is not None and email:
            existing_email_keys.add((name, email))