import json
import os
import time
from datetime import date
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("HIGHLIGHTLY_API_KEY")
BASE_URL = "https://cricket.highlightly.net"
CACHE_FILE = Path(__file__).parent / "highlightly_cache.json"

LIVE_WORDS = ("inplay", "inningsbreak", "stumps", "tea", "lunch", "dinner", "drinks")
ENDED_WORDS = ("finished", "abandoned", "noresult")


def _load():
    try:
        return json.loads(CACHE_FILE.read_text())
    except Exception:
        return {}


_cache = _load()  # {key: [time_saved, data]}


def _save():
    try:
        CACHE_FILE.write_text(json.dumps(_cache))
    except Exception:
        pass


def fetch_day(day, ttl=300):
    """All matches for one day. Reuses a saved copy younger than ttl seconds,
    and falls back to an older copy if the API fails."""
    key = f"matches:{day}"
    now = time.time()
    saved = _cache.get(key)
    if saved and now - saved[0] < ttl:
        return saved[1], saved[0]
    try:
        response = httpx.get(
            f"{BASE_URL}/matches",
            params={"date": day, "limit": 50},
            headers={"x-rapidapi-key": API_KEY},
            timeout=15,
        )
        response.raise_for_status()
        data = response.json()
    except Exception:
        if saved:
            return saved[1], saved[0]  # older data beats an error page
        raise
    _cache[key] = [now, data]
    _save()
    return data, now


def _team(team, state):
    team = team or {}
    state = state or {}
    return {
        "name": team.get("name"),
        "short": team.get("abbreviation"),
        "logo": team.get("logo"),
        "score": state.get("score"),
        "info": state.get("info"),
    }


def _tidy(m):
    st = m.get("state") or {}
    teams = st.get("teams") or {}
    venue = m.get("venue")
    if isinstance(venue, dict):
        venue = venue.get("name")
    return {
        "id": m.get("id"),
        "league": (m.get("league") or {}).get("name"),
        "venue": venue,
        "state": st.get("description"),
        "report": st.get("report"),
        "home": _team(m.get("homeTeam"), teams.get("home")),
        "away": _team(m.get("awayTeam"), teams.get("away")),
    }


def live_tests():
    """International Tests that are in play or between sessions. Returns (list, fetched_at)."""
    data, fetched_at = fetch_day(date.today().isoformat())
    out = []
    for m in data.get("data") or []:
        if (m.get("format") or "").upper() != "TEST":
            continue
        if ((m.get("country") or {}).get("name") or "") != "World":
            continue  # keeps internationals, drops domestic and 'A' team matches
        desc = ((m.get("state") or {}).get("description") or "").lower().replace(" ", "")
        if any(w in desc for w in LIVE_WORDS) and not any(w in desc for w in ENDED_WORDS):
            out.append(_tidy(m))
    return out, fetched_at


from datetime import timedelta  # noqa: E402

RESULT_DAYS = 5  # today plus the 4 days before


def recent_tests():
    """International Tests that have finished in the last few days.
    Returns (matches, oldest_fetch_time, days_that_failed)."""
    found = {}
    oldest = None
    missed = 0
    for back in range(RESULT_DAYS):
        day = (date.today() - timedelta(days=back)).isoformat()
        ttl = 300 if back == 0 else 21600 if back == 1 else 86400
        try:
            data, fetched_at = fetch_day(day, ttl=ttl)
        except Exception:
            missed += 1
            continue
        oldest = fetched_at if oldest is None else min(oldest, fetched_at)
        for m in data.get("data") or []:
            if (m.get("format") or "").upper() != "TEST":
                continue
            if ((m.get("country") or {}).get("name") or "") != "World":
                continue
            desc = ((m.get("state") or {}).get("description") or "").lower().replace(" ", "")
            if desc != "finished" or m.get("id") in found:
                continue
            item = _tidy(m)
            item["start"] = m.get("startDate")
            item["end"] = m.get("endDate")
            found[m.get("id")] = item
    matches = sorted(found.values(), key=lambda x: x.get("end") or "", reverse=True)
    return matches, oldest, missed
