import re
import pandas as pd
from typing import Set, Tuple, Optional


def _normalize(value: str) -> str:
    """
    Reduce a string to lowercase alphanumeric for fuzzy key matching.
    'Pizza Palace LLC' → 'pizzapalacellc'
    '+1 (800) 555-1234' → '18005551234'
    """
    return re.sub(r"[^a-z0-9]", "", str(value).lower())


def build_existing_keys(df: pd.DataFrame) -> Set[Tuple[str, str]]:
    if df.empty:
        return set()
    names  = df["business_name"].fillna("").astype(str).apply(_normalize)
    phones = df["phone"].fillna("").astype(str).apply(_normalize)
    return {(n, p) for n, p in zip(names, phones) if n}


def is_duplicate(lead: dict, existing_keys: Set[Tuple[str, str]]) -> bool:
    """Return True if this lead already exists in the keyset."""
    name  = _normalize(lead.get("business_name", ""))
    phone = _normalize(lead.get("phone", ""))
    return (name, phone) in existing_keys


def build_existing_email_keys(df: pd.DataFrame) -> Set[Tuple[str, str]]:
    if df.empty:
        return set()
    names  = df["business_name"].fillna("").astype(str).apply(_normalize)
    emails = df["email"].fillna("").astype(str).str.strip().str.lower()
    return {(n, e) for n, e in zip(names, emails) if n and e}


def is_email_duplicate(lead: dict, existing_email_keys: Set[Tuple[str, str]]) -> bool:
    """Return True if this lead's business name + email already exists."""
    name  = _normalize(lead.get("business_name", ""))
    email = str(lead.get("email", "")).strip().lower()
    if not email:
        return False
    return (name, email) in existing_email_keys


def register_lead(lead: dict, existing_keys: Set[Tuple[str, str]], existing_email_keys: Optional[Set[Tuple[str, str]]] = None) -> None:
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