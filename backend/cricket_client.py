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
PAUSE_AFTER_FAILURE = 1800  # seconds to leave the API alone after an error


def _load():
    try:
        return json.loads(CACHE_FILE.read_text())
    except Exception:
        return {}


_cache = _load()  # {key: [time_saved, data]}
_paused_until = {}  # {key: time when we may try again}


def _save():
    try:
        CACHE_FILE.write_text(json.dumps(_cache))
    except Exception:
        pass


def fetch(endpoint, params=None, ttl=300):
    """Call CricketData.org with caching. After a failure, wait 30 minutes
    before trying the same call again; serve old saved data meanwhile."""
    params = params or {}
    cache_key = endpoint + str(sorted(params.items()))
    now = time.time()
    saved = _cache.get(cache_key)

    if saved and now - saved[0] < ttl:
        return saved[1]  # fresh enough, no API request used

    if now < _paused_until.get(cache_key, 0):
        if saved:
            old = dict(saved[1])
            old["_stale"] = True
            return old
        raise RuntimeError("CricketData is paused after an earlier error; retrying later")

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
        _paused_until[cache_key] = now + PAUSE_AFTER_FAILURE
        if saved:
            old = dict(saved[1])
            old["_stale"] = True
            return old
        raise

    data["_fetched_at"] = now
    _cache[cache_key] = [now, data]
    _save()
    return data
