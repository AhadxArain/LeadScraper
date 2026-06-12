import re
import json
import whois
import requests
from bs4 import BeautifulSoup
from typing import Optional
from urllib.parse import urlparse, urljoin
from concurrent.futures import ThreadPoolExecutor, as_completed
from config.settings import EMAIL_FETCH_TIMEOUT

# ── Email regex ───────────────────────────────────────────────────────────────
_EMAIL_RE = re.compile(
    r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+",
    re.IGNORECASE,
)

# ── Obfuscated email pattern: "info [at] domain [dot] com" ──────────────────
_OBFUSCATED_RE = re.compile(
    r"([a-zA-Z0-9_.+-]+)\s*(?:\[at\]|\(at\)|\s@\s|＠)\s*([a-zA-Z0-9-]+)\s*(?:\[dot\]|\(dot\))\s*([a-zA-Z]{2,})",
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

# ── Contact page fallback paths ──────────────────────────────────────────────
_CONTACT_PATHS = [
    "", "/contact", "/contact-us", "/contactus", "/contact.html",
    "/about", "/about-us", "/aboutus", "/about.html",
    "/team", "/our-team", "/staff", "/reach-us", "/get-in-touch",
    "/support", "/customer-service", "/locations",
]

# ── Keywords that identify a contact/about link on a homepage ────────────────
_CONTACT_LINK_KEYWORDS = (
    "contact", "about", "team", "staff", "reach", "connect",
    "support", "get-in-touch", "getintouch", "location", "info",
)


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
    if re.match(r"^[a-z]+[._-][a-z]+$", local):      # john.smith / john_smith
        score += 15
    elif re.match(r"^[a-z]{3,}$", local):             # plain name: john
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

    # +5: business-facing soft prefixes
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


def _decode_cfemail(encoded: str) -> Optional[str]:
    """Decode Cloudflare email protection (data-cfemail attribute)."""
    try:
        key = int(encoded[:2], 16)
        return "".join(
            chr(int(encoded[i:i + 2], 16) ^ key)
            for i in range(2, len(encoded), 2)
        )
    except Exception:
        return None


def _extract_from_html(html: str) -> Optional[str]:
    """
    Extract the first valid business email from raw HTML.
    Order: mailto links → Cloudflare-protected → JSON-LD → text regex → obfuscated text.
    """
    try:
        soup = BeautifulSoup(html, "lxml")

        # Pass 1: mailto: href links — most reliable
        for tag in soup.find_all("a", href=True):
            href = tag["href"]
            if href.lower().startswith("mailto:"):
                result = _clean_email(href[7:])
                if result:
                    return result

        # Pass 2: Cloudflare-obfuscated emails (very common on small biz sites)
        for tag in soup.select("[data-cfemail]"):
            decoded = _decode_cfemail(tag.get("data-cfemail", ""))
            if decoded:
                result = _clean_email(decoded)
                if result:
                    return result

        # Pass 3: JSON-LD structured data (schema.org LocalBusiness)
        for script in soup.find_all("script", type="application/ld+json"):
            try:
                data = json.loads(script.string or "")
                items = data if isinstance(data, list) else [data]
                for item in items:
                    if isinstance(item, dict):
                        em = item.get("email", "")
                        if em:
                            result = _clean_email(em.replace("mailto:", ""))
                            if result:
                                return result
            except Exception:
                continue

        # Pass 4: regex over visible text
        text = soup.get_text(separator=" ")
        for candidate in _EMAIL_RE.findall(text):
            result = _clean_email(candidate)
            if result:
                return result

        # Pass 5: obfuscated text patterns — "info [at] domain [dot] com"
        m = _OBFUSCATED_RE.search(text)
        if m:
            result = _clean_email(f"{m.group(1)}@{m.group(2)}.{m.group(3)}")
            if result:
                return result
    except Exception:
        pass
    return None


def _fetch_html(url: str) -> Optional[str]:
    """Fetch raw HTML (no extraction). Returns None on any failure."""
    try:
        resp = requests.get(
            url,
            timeout=EMAIL_FETCH_TIMEOUT,
            headers={"User-Agent": "Mozilla/5.0 (compatible; LeadBot/1.0)"},
            allow_redirects=True,
        )
        if resp.status_code == 200:
            return resp.text
    except Exception:
        pass
    return None


def _fetch_page(url: str) -> Optional[str]:
    """
    Fetch a single URL and return extracted email or None.
    Swallows all exceptions — used inside thread pool.
    """
    html = _fetch_html(url)
    if html:
        return _extract_from_html(html)
    return None


def _discover_contact_links(html: str, base_url: str) -> list:
    """Pull internal links whose href/text suggests a contact/about page."""
    found = []
    try:
        soup = BeautifulSoup(html, "lxml")
        for tag in soup.find_all("a", href=True):
            href = tag["href"].lower()
            text = (tag.get_text() or "").lower()
            if any(kw in href or kw in text for kw in _CONTACT_LINK_KEYWORDS):
                full = urljoin(base_url + "/", tag["href"])
                if full.startswith("http") and urlparse(full).netloc == urlparse(base_url).netloc:
                    found.append(full.split("#")[0])
        # Dedup, keep order, cap at 6 to bound request count
        seen, unique = set(), []
        for u in found:
            if u not in seen:
                seen.add(u)
                unique.append(u)
        return unique[:6]
    except Exception:
        return []


def extract_email_from_website(base_url: str) -> Optional[str]:
    """
    LAYER 1 — Smart parallel crawl.
    1. Fetch homepage; extract email if present.
    2. Discover REAL contact-page links from homepage HTML.
    3. Crawl discovered links + fallback hardcoded paths concurrently.
    Returns first valid business email found, or None.
    """
    if not base_url or not base_url.startswith("http"):
        return None
    base_url = base_url.rstrip("/")

    # Step 1: homepage fetch (single request, reused for link discovery)
    homepage_html = _fetch_html(base_url)
    if homepage_html:
        result = _extract_from_html(homepage_html)
        if result:
            return result

    # Step 2: build candidate list — discovered links first (highest signal)
    candidates = []
    if homepage_html:
        candidates.extend(_discover_contact_links(homepage_html, base_url))
    candidates.extend(base_url + p for p in _CONTACT_PATHS if p)  # skip "" (already fetched)

    # Dedup preserving order
    seen, urls = set(), []
    for u in candidates:
        if u not in seen:
            seen.add(u)
            urls.append(u)

    # Step 3: crawl all candidates concurrently, first hit wins
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = {pool.submit(_fetch_page, url): url for url in urls[:10]}
        for future in as_completed(futures):
            result = future.result()
            if result:
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
        emails = w.emails
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