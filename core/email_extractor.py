import re
import whois
import requests
from bs4 import BeautifulSoup
from typing import Optional
from urllib.parse import urlparse
from concurrent.futures import ThreadPoolExecutor, as_completed

from config.settings import EMAIL_FETCH_TIMEOUT

# ── Email regex ───────────────────────────────────────────────────────────────
_EMAIL_RE = re.compile(
    r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+",
    re.IGNORECASE,
)

# ── Junk email prefixes (local part before @) ────────────────────────────────
_JUNK_PREFIXES = {
    "abuse", "postmaster", "webmaster", "hostmaster",
    "noreply", "no-reply", "donotreply", "do-not-reply",
    "info", "admin", "administrator", "support", "contact",
    "help", "hello", "sales", "billing", "legal",
    "privacy", "security", "spam", "report",
    "domains", "registrar", "whois", "dns",
    "mailer-daemon", "bounce", "unsubscribe", "domain.operations", "domain",
}

# ── Blocked registrar / hosting / platform domains ───────────────────────────
_BLOCKED_DOMAINS = {
    "godaddy.com", "domaincontrol.com", "secureserver.net",
    "namecheap.com", "registrar-servers.com", "whoisguard.com",
    "networksolutions.com", "name.com", "hover.com",
    "bluehost.com", "hostgator.com", "siteground.com",
    "dreamhost.com", "ionos.com", "register.com",
    "enom.com", "tucows.com", "uniregistry.com",
    "cloudflare.com", "amazonaws.com", "awsdns.com",
    "wixpress.com", "squarespace.com", "shopify.com",
    "wordpress.com", "weebly.com", "jimdo.com",
    "googledomains.com", "domains.google",
    "sentry.io", "mailchimp.com", "constantcontact.com",
    "sendgrid.com", "mailgun.com", "mandrillapp.com",
    "example.com", "test.com", "placeholder.com",
    "w3.org", "schema.org", "jquery.com",
    "facebook.com", "fb.com", "twitter.com", "instagram.com",
    "linkedin.com", "youtube.com", "tiktok.com",
    "apple.com", "microsoft.com",
    "privacyprotect.org", "withheldforprivacy.com",
    "domainsbyproxy.com", "perfectprivacy.com",
    "contactprivacy.com", "web.com",
}

# ── Contact page paths to try ────────────────────────────────────────────────
_CONTACT_PATHS = [
    "", "/contact", "/contact-us", "/about",
    "/about-us", "/team", "/reach-us",
]


def _is_junk_email(email: str) -> bool:
    """
    Return True if the email is a registrar, hosting, or generic address
    that is definitely NOT a real business contact.
    """
    if not email or "@" not in email:
        return True

    email_lower = email.lower()
    local, domain = email_lower.split("@", 1)

    # Layer A: blocked prefix
    if local in _JUNK_PREFIXES:
        return True

    # Layer B: blocked domain
    if domain in _BLOCKED_DOMAINS:
        return True

    # Layer C: pattern checks
    junk_keywords = [
        "privacy", "whois", "abuse", "noreply",
        "no-reply", "donotreply",
    ]
    if any(kw in email_lower for kw in junk_keywords):
        return True

    if len(email) > 100:
        return True

    if local.isdigit():
        return True

    return False


def is_valid_business_email(email: str) -> bool:
    """
    Return True only if the email looks like a real business contact.
    Must pass AFTER _is_junk_email() check.
    """
    if not email or "@" not in email:
        return False

    local, domain = email.lower().split("@", 1)

    if "." not in domain:
        return False

    tld = domain.rsplit(".", 1)[-1]
    if len(tld) < 2:
        return False

    if len(local) < 2:
        return False

    return True


def score_email_confidence(email: str, business_domain: str = "") -> int:
    """
    Returns a confidence score 0-100 for a business email.
    Used for lead quality ranking. No external API required.
    
    Scoring bands:
      80-100 : High confidence — domain match, professional local-part
      50-79  : Medium — generic but real provider, or partial domain match
      20-49  : Low — free provider, short local-part, suspicious pattern
      0      : Junk / already filtered
    """
    if not email or "@" not in email:
        return 0
    if _is_junk_email(email):
        return 0

    local, domain = email.lower().split("@", 1)
    score = 50  # baseline

    # +30: email domain matches business website domain
    if business_domain:
        biz_domain = business_domain.lower().replace("www.", "").split("/")[0]
        if domain == biz_domain:
            score += 30
        elif biz_domain.endswith(f".{domain}") or domain.endswith(f".{biz_domain}"):
            score += 15

    # +15: professional local-part (name-like pattern)
    import re as _re
    if _re.match(r'^[a-z]+[._-][a-z]+$', local):      # john.smith / john_smith
        score += 15
    elif _re.match(r'^[a-z]{3,}$', local):             # plain name: john
        score += 8

    # -20: free email provider
    FREE_PROVIDERS = {
        "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
        "aol.com", "icloud.com", "protonmail.com", "mail.com",
        "zoho.com", "yandex.com",
    }
    if domain in FREE_PROVIDERS:
        score -= 20

    # -10: numeric-heavy local part (auto-generated feel)
    digits = sum(c.isdigit() for c in local)
    if digits > len(local) * 0.4:
        score -= 10

    # +5: common professional prefixes that are still business-facing
    SOFT_PREFIXES = {"owner", "manager", "director", "ceo", "info"}
    if local in SOFT_PREFIXES:
        score += 5

    return max(0, min(100, score))


def _clean_email(raw: str) -> Optional[str]:
    """
    Strip query params from mailto links and validate.
    Returns clean email or None.
    """
    email = raw.split("?")[0].strip().lower()
    if _EMAIL_RE.match(email) and not _is_junk_email(email) and is_valid_business_email(email):
        return email
    return None


def _extract_from_html(html: str) -> Optional[str]:
    """
    Extract the first valid business email from raw HTML.
    Checks mailto: links first, then regex scan of full text.
    """
    try:
        soup = BeautifulSoup(html, "lxml")

        # Pass 1: mailto: href links — most reliable
        for tag in soup.find_all("a", href=True):
            href = tag.get("href")
            if isinstance(href, list):
                href = href[0] if href else ""
            if isinstance(href, str) and href.lower().startswith("mailto:"):
                result = _clean_email(href[7:])
                if result:
                    return result

        # Pass 2: regex over visible text
        text = soup.get_text(separator=" ")
        for candidate in _EMAIL_RE.findall(text):
            result = _clean_email(candidate)
            if result:
                return result

    except Exception:
        pass

    return None


def _fetch_page(url: str) -> Optional[str]:
    """
    Fetch a single URL and return extracted email or None.
    Swallows all exceptions — used inside thread pool.
    """
    try:
        resp = requests.get(
            url,
            timeout=EMAIL_FETCH_TIMEOUT,
            headers={"User-Agent": "Mozilla/5.0 (compatible; LeadBot/1.0)"},
            allow_redirects=True,
        )
        if resp.status_code == 200:
            return _extract_from_html(resp.text)
    except Exception:
        pass
    return None


def extract_email_from_website(base_url: str) -> Optional[str]:
    """
    LAYER 1 — Parallel multi-page website crawl.
    Tries homepage + 6 common contact paths simultaneously.
    Returns first valid business email found, or None.
    """
    if not base_url or not base_url.startswith("http"):
        return None

    base_url = base_url.rstrip("/")
    urls = [base_url + path for path in _CONTACT_PATHS]

    with ThreadPoolExecutor(max_workers=5) as pool:
        futures = {pool.submit(_fetch_page, url): url for url in urls}
        for future in as_completed(futures):
            result = future.result()
            if result:
                # Cancel remaining futures early
                for f in futures:
                    f.cancel()
                return result

    return None


def extract_email_from_whois(website_url: str) -> Optional[str]:
    """
    LAYER 3 — WHOIS domain lookup.
    Domain registrant email is often the real business owner contact.
    Returns first valid email from WHOIS record, or None.
    """
    if not website_url:
        return None

    try:
        domain = urlparse(website_url).netloc.replace("www.", "")
        if not domain:
            return None

        w = whois.whois(domain)
        emails = w.get("emails") if isinstance(w, dict) else getattr(w, "emails", None)

        if not emails:
            return None

        if isinstance(emails, str):
            emails = [emails]

        for e in emails:
            if e:
                result = _clean_email(e)
                if result:
                    return result

    except Exception:
        pass

    return None