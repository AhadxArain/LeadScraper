from datetime import datetime
from typing import Generator, Dict, Any

from config.settings import (
    MAX_PAGES,
    VALID_LEADS_FILE, REJECTED_LEADS_FILE, EXISTING_LEADS_FILE,
    LEAD_COLUMNS, REJECTED_COLUMNS,
)
from core.serper_client   import fetch_places, search_business_email, search_email_via_site_search
from core.email_extractor import extract_email_from_website, extract_email_from_whois
from core.validator       import validate_lead
from core.deduplicator    import build_existing_keys, build_existing_email_keys, is_duplicate, is_email_duplicate, register_lead
from storage.csv_store    import load_valid_leads, append_to_csv
from utils.logger         import log_run


# ── Internal helpers ──────────────────────────────────────────────────────────

def _build_lead(place: dict, business_type: str, zip_code: str) -> dict:
    """Map a raw Serper places dict to the project's lead schema."""
    return {
        "business_name": (place.get("title")        or "").strip(),
        "phone":         (place.get("phoneNumber")   or "").strip(),
        "email":         "",  # populated by email extractor below
        "website":       (place.get("website")       or "").strip(),
        "address":       (place.get("address")       or "").strip(),
        "rating":        str(place.get("rating",      "")),
        "reviews":       str(place.get("reviewsCount", place.get("reviews", ""))),
        "business_type": business_type,
        "zip_code":      zip_code,
        "source_url":    (place.get("website") or place.get("cid") or "").strip(),
        "scraped_at":    datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }


def _make_status(page, valid, rejected, existing, msg, done=False, **extra) -> dict:
    """Construct a uniform status dict for the Streamlit generator consumer."""
    return {
        "page":           page,
        "valid_count":    valid,
        "rejected_count": rejected,
        "existing_count": existing,
        "status_msg":     msg,
        "done":           done,
        **extra,
    }


# ── Public generator ──────────────────────────────────────────────────────────

def run_scraper(
    business_type: str,
    zip_code: str,
    required_leads: int,
) -> Generator[Dict[str, Any], None, None]:
    """
    Core scraping generator.

    Yields status dicts on every meaningful action so the Streamlit UI
    can display live progress without any blocking.
    """

    # Load ALL previously saved valid leads once at start for dedup
    existing_df   = load_valid_leads()
    existing_keys = build_existing_keys(existing_df)
    existing_email_keys = build_existing_email_keys(existing_df)

    valid_count    = 0
    rejected_count = 0
    existing_count = 0
    pages_scraped  = 0

    # Collect in memory; batch-write to CSV at the very end (avoids partial writes)
    valid_batch    = []
    rejected_batch = []
    existing_batch = []

    page = 1
    while valid_count < required_leads and page <= MAX_PAGES:
        pages_scraped = page
        yield _make_status(
            page, valid_count, rejected_count, existing_count,
            f"📄 Fetching Serper page {page}…"
        )

        # ── Serper API call ───────────────────────────────────────────────────
        try:
            places = fetch_places(business_type, zip_code, page=page)
        except RuntimeError as exc:
            yield _make_status(
                page, valid_count, rejected_count, existing_count,
                f"⚠️  API error on page {page}: {exc}"
            )
            break  # stop on API failure; save what we have

        if not places:
            yield _make_status(
                page, valid_count, rejected_count, existing_count,
                "ℹ️  Serper returned no more results."
            )
            break

        # ── Process each result ───────────────────────────────────────────────
        for place in places:
            if valid_count >= required_leads:
                break

            lead = _build_lead(place, business_type, zip_code)
            biz  = lead["business_name"] or "Unknown Business"

            # ── Step 1: Duplicate check ───────────────────────────────────────
            if is_duplicate(lead, existing_keys):
                existing_count += 1
                existing_batch.append(lead)
                yield _make_status(
                    page, valid_count, rejected_count, existing_count,
                    f"🔄 Already exists: {biz}"
                )
                continue

            # ── Step 2: Email extraction (5-Layer) ────────────────────────────
            email = None
            
            # Layer 1: Multi-page parallel website crawl
            if lead["website"]:
                yield _make_status(
                    page, valid_count, rejected_count, existing_count,
                    f"🔍 Layer 1: scanning website pages for {biz}..."
                )
                email = extract_email_from_website(lead["website"])
                if email: lead["email_source"] = "Layer 1 website"

            # Layer 2: Serper web search
            if not email:
                yield _make_status(
                    page, valid_count, rejected_count, existing_count,
                    f"🔎 Layer 2: Serper web search for {biz} email..."
                )
                email = search_business_email(
                    lead["business_name"], lead["address"]
                )
                if email: lead["email_source"] = "Layer 2 Serper"

            # Layer 3: WHOIS lookup
            if not email and lead["website"]:
                yield _make_status(
                    page, valid_count, rejected_count, existing_count,
                    f"📋 Layer 3: WHOIS lookup for {biz}..."
                )
                email = extract_email_from_whois(lead["website"])
                if email: lead["email_source"] = "Layer 3 WHOIS"

            # Layer 4: Serper site: search
            if not email and lead["website"]:
                yield _make_status(
                    page, valid_count, rejected_count, existing_count,
                    f"🌐 Layer 4: site-search for {biz}..."
                )
                email = search_email_via_site_search(lead["website"])
                if email: lead["email_source"] = "Layer 4 site:search"

            lead["email"] = email or ""

            # ── Step 2.5: Email duplicate check ───────────────────────────────
            if is_email_duplicate(lead, existing_email_keys):
                existing_count += 1
                existing_batch.append(lead)
                yield _make_status(
                    page, valid_count, rejected_count, existing_count,
                    f"🔄 Already exists (same email): {biz}"
                )
                continue

            # ── Step 3: Validation ────────────────────────────────────────────
            is_valid, reason = validate_lead(lead)

            if is_valid:
                valid_count += 1
                register_lead(lead, existing_keys, existing_email_keys)  # prevent in-run duplicates
                valid_batch.append(lead)
                yield _make_status(
                    page, valid_count, rejected_count, existing_count,
                    f"✅ Valid lead: {biz}  ({valid_count}/{required_leads})"
                )
            else:
                rejected_count += 1
                rejected_batch.append({**lead, "rejection_reason": reason})
                yield _make_status(
                    page, valid_count, rejected_count, existing_count,
                    f"❌ Rejected ({reason}): {biz}"
                )

        page += 1

    # ── Batch write to CSVs (single append per file, no partial corruption) ───
    if valid_batch:
        # Before saving, we can optionally strip internal fields, but pandas will only grab LEAD_COLUMNS
        append_to_csv(VALID_LEADS_FILE,    valid_batch,    LEAD_COLUMNS)
    if rejected_batch:
        append_to_csv(REJECTED_LEADS_FILE, rejected_batch, REJECTED_COLUMNS)
    if existing_batch:
        append_to_csv(EXISTING_LEADS_FILE, existing_batch, LEAD_COLUMNS)

    # ── Log the run ───────────────────────────────────────────────────────────
    run_id = log_run(
        business_type  = business_type,
        zip_code       = zip_code,
        requested_leads= required_leads,
        valid_count    = valid_count,
        rejected_count = rejected_count,
        existing_count = existing_count,
        pages_scraped  = pages_scraped,
    )

    yield _make_status(
        pages_scraped, valid_count, rejected_count, existing_count,
        f"✅ Run {run_id} complete — {valid_count} valid leads collected across {pages_scraped} pages.",
        done=True,
        run_id=run_id,
        valid_batch=valid_batch, # Added to easily read results in test run script
    )