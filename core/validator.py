import requests
from config.settings import BOUNCER_API_KEY
from core.email_extractor import _is_junk_email, is_valid_business_email
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

    # Bouncer API check
    if BOUNCER_API_KEY:
        try:
            resp = requests.get(
                "https://api.usebouncer.com/v1.1/email/verify",
                params={"email": email},
                headers={"x-api-key": BOUNCER_API_KEY},
                timeout=30
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == "undeliverable":
                    return False, f"Bouncer rejected email (undeliverable): {email}"
            else:
                return False, f"Bouncer API failed (HTTP {resp.status_code}): {email}"
        except Exception as e:
            return False, f"Bouncer verification error (timeout or network): {email}"

    return True, ""