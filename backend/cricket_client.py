import json
import os
import time
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("CRICKET_API_KEY")
BASE_URL = "https://api.cricapi.com/v1"
CACHE_FILE = Path(__file__).parent / "cache.json"


def _load():
    try:
        return json.loads(CACHE_FILE.read_text())
    except Exception:
        return {}  # no file yet, or it is unreadable


_cache = _load()  # {key: [time_saved, data]}


def _save():
    try:
        CACHE_FILE.write_text(json.dumps(_cache))
    except Exception:
        pass  # failing to save must never break the app


def fetch(endpoint, params=None, ttl=300):
    """Call CricketData.org, reusing a saved response if it is newer than ttl seconds.
    If the API fails, fall back to the last saved copy (marked _stale)."""
    params = params or {}
    cache_key = endpoint + str(sorted(params.items()))
    now = time.time()
    saved = _cache.get(cache_key)

    if saved and now - saved[0] < ttl:
        return saved[1]  # fresh enough, no API request used

    try:
        response = httpx.get(
            f"{BASE_URL}/{endpoint}",
            params={**params, "apikey": API_KEY},
            timeout=15,
        )
        response.raise_for_status()
        data = response.json()
        if data.get("status") != "success":
            raise RuntimeError(data.get("reason", "Unknown API error"))
    except Exception:
        if saved:
            old = dict(saved[1])
            old["_stale"] = True
            return old  # old data is better than an error page
        raise

    data["_fetched_at"] = now
    _cache[cache_key] = [now, data]
    _save()
    return data
