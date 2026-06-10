from core.email_extractor import _is_junk_email, is_valid_business_email
from core.email_verifier import verify_email_free
_REQUIRED = ["business_name", "email"]
def validate_lead(lead: dict):
    missing = [
        field for field in _REQUIRED
        if not (lead.get(field) or "").strip()
    ]
    if missing:
        return False, f"Missing: {', '.join(missing)}"

    email = lead.get("email", "").strip()
    if _is_junk_email(email) or not is_valid_business_email(email):
        return False, f"Invalid email: {email}"

    # Free verification: syntax + disposable + MX record check (no API cost)
    ok, reason = verify_email_free(email)
    if not ok:
        return False, f"Email failed verification ({reason}): {email}"
    return True, ""