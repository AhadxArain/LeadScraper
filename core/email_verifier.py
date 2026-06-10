import re
import dns.resolver
from functools import lru_cache

_SYNTAX_RE = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

# Common disposable/temp email domains — extend freely
_DISPOSABLE = {
    "mailinator.com", "guerrillamail.com", "10minutemail.com",
    "tempmail.com", "throwaway.email", "yopmail.com",
    "trashmail.com", "getnada.com", "temp-mail.org",
    "fakeinbox.com", "sharklasers.com", "maildrop.cc",
}

@lru_cache(maxsize=2048)
def _domain_has_mx(domain: str) -> bool:
    """Return True if domain has valid MX records (can receive mail). Cached."""
    try:
        records = dns.resolver.resolve(domain, "MX", lifetime=5)
        return len(records) > 0
    except Exception:
        # Fallback: some domains accept mail on A record
        try:
            dns.resolver.resolve(domain, "A", lifetime=5)
            return True
        except Exception:
            return False

def verify_email_free(email: str) -> tuple[bool, str]:
    """
    Free email verification: syntax + disposable check + MX lookup.
    Returns (is_valid, reason). No API, no cost.
    """
    if not email or "@" not in email:
        return False, "no email"

    email = email.strip().lower()

    # Layer 1: syntax
    if not _SYNTAX_RE.match(email):
        return False, "bad syntax"

    domain = email.split("@", 1)[1]

    # Layer 2: disposable domain block
    if domain in _DISPOSABLE:
        return False, "disposable domain"

    # Layer 3: MX record check (does the domain accept mail?)
    if not _domain_has_mx(domain):
        return False, "no MX record"

    return True, ""