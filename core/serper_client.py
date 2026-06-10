import requests
import time
from typing import List, Optional
from urllib.parse import urlparse

from config.settings import SERPER_API_KEY, SERPER_MAPS_URL, SERPER_RESULTS_PER_PAGE
from core.email_extractor import _EMAIL_RE, _is_junk_email, is_valid_business_email


def _serper_request_with_retry(url: str, payload: dict, max_retries: int = 2) -> dict:
    """Serper POST with exponential backoff on 429/timeout only. No unconditional sleep."""
    if not SERPER_API_KEY:
        raise ValueError("SERPER_API_KEY is missing from environment variables.")
    _SERPER_SESSION.headers["X-API-KEY"] = SERPER_API_KEY
    retries = 0
    while True:
        try:
            resp = _SERPER_SESSION.post(url, json=payload, timeout=15)
            if resp.status_code == 429:
                if retries < max_retries:
                    retries += 1
                    time.sleep(2 ** retries)   # 2s, 4s
                    continue
                raise RuntimeError("Serper rate limit exceeded after retries.")
            resp.raise_for_status()
            return resp.json()
        except requests.exceptions.Timeout:
            if retries < max_retries:
                retries += 1
                time.sleep(2 ** retries)
                continue
            raise RuntimeError("Serper request timed out after retries.")
        except RuntimeError:
            raise
        except Exception as exc:
            raise RuntimeError(f"Serper error: {exc}") from exc

_SERPER_SESSION = requests.Session()
_SERPER_SESSION.headers.update({
    "Content-Type": "application/json",
})


def fetch_places(business_type: str, zip_code: str, page: int = 1) -> List[dict]:
    """Fetch local business results from Serper Maps API."""
    payload = {
        "q":        business_type,
        "location": f"{zip_code}, United States",
        "page":     page,
        "num":      SERPER_RESULTS_PER_PAGE,
    }
    
    try:
        data = _serper_request_with_retry(SERPER_MAPS_URL, payload)
        return data.get("places", [])
    except RuntimeError as exc:
        raise RuntimeError(f"Serper error (page {page}): {exc}") from exc


def search_business_email(business_name: str, address: str) -> Optional[str]:
    """
    Layer 2: POST to https://google.serper.dev/search to find email using business name and city.
    """
    if not business_name:
        return None
        
    payload = {
        "q": f'"{business_name}" email contact',
        "gl": "us",
        "num": 5,
    }
    
    try:
        data = _serper_request_with_retry("https://google.serper.dev/search", payload)
        
        for result in data.get("organic", []):
            texts_to_check = [
                result.get("snippet", ""),
                result.get("title", ""),
                result.get("link", ""),
            ]
            
            sitelinks = result.get("sitelinks", [])
            if isinstance(sitelinks, list):
                for sl in sitelinks:
                    texts_to_check.append(sl.get("title", ""))
                    texts_to_check.append(sl.get("link", ""))
                
            for text in texts_to_check:
                for email in _EMAIL_RE.findall(text):
                    if not _is_junk_email(email) and is_valid_business_email(email):
                        return email
                        
        return None
    except Exception:
        # Best-effort
        return None


def search_email_via_site_search(url: str) -> Optional[str]:
    """
    Layer 4: Serper site: search.
    """
    if not url or not url.startswith("http"):
        return None
        
    try:
        domain = urlparse(url).netloc.replace("www.", "")
        if not domain:
            return None
            
        payload = {
            "q": f'site:{domain} email',
            "num": 3,
        }
        
        data = _serper_request_with_retry("https://google.serper.dev/search", payload)
        
        for result in data.get("organic", []):
            texts_to_check = [
                result.get("snippet", ""),
                result.get("title", ""),
            ]
            
            for text in texts_to_check:
                for email in _EMAIL_RE.findall(text):
                    if not _is_junk_email(email) and is_valid_business_email(email):
                        return email
                        
        return None
    except Exception:
        return None