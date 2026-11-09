import re
from datetime import date

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from cricket_client import fetch
from scorecard import clean_scorecard, label_scores

app = FastAPI(title="Test Cricket Live Tracker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # we will restrict this to our Netlify address later
    allow_methods=["GET"],
    allow_headers=["*"],
)

PAGE_SIZE = 25  # the API returns 25 rows per page

FINISHED_WORDS = ("won by", "drawn", "tied", "no result", "abandoned")
IN_PROGRESS_WORDS = ("day ", "stumps", "lunch", "innings break", "session")


def get_all(endpoint, ttl, max_pages=3):
    """Read several pages and join them. Returns (rows, oldest_fetch_time)."""
    rows = []
    times = []
    for page in range(max_pages):
        offset = page * PAGE_SIZE
        data = fetch(endpoint, {"offset": offset}, ttl=ttl)
        rows.extend(data.get("data") or [])
        if data.get("_fetched_at"):
            times.append(data["_fetched_at"])
        total = (data.get("info") or {}).get("totalRows") or 0
        if offset + PAGE_SIZE >= total:
            break
    return rows, (min(times) if times else None)


def is_official_test(match):
    """True for official Tests. The API sometimes leaves matchType empty,
    so we also look for the whole word 'Test' in the match name."""
    name = (match.get("name") or "").lower()
    if "unofficial" in name:
        return False
    kind = (match.get("matchType") or "").lower()
    return kind == "test" or re.search(r"\btest\b", name) is not None


def match_state(match):
    """Return 'upcoming', 'live' or 'ended' using both the flags and the status text."""
    if not match.get("matchStarted"):
        return "upcoming"
    status = (match.get("status") or "").lower()
    if any(word in status for word in FINISHED_WORDS):
        return "ended"
    if match.get("matchEnded") and not any(w in status for w in IN_PROGRESS_WORDS):
        return "ended"
    return "live"


def tests_in_state(state):
    rows, fetched_at = get_all("currentMatches", ttl=900)
    matches = [m for m in rows if is_official_test(m) and match_state(m) == state]
    return matches, fetched_at


def respond(state):
    try:
        matches, fetched_at = tests_in_state(state)
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"Cricket API error: {error}")
    matches = [label_scores(m) for m in matches]
    matches.sort(key=lambda m: m.get("dateTimeGMT") or "")
    return {"count": len(matches), "updated_at": fetched_at, "matches": matches}


@app.get("/")
def home():
    return {"message": "Hello, Cricket! The backend is running."}


@app.get("/api/matches/live")
def live_matches():
    return respond("live")


@app.get("/api/matches/upcoming")
def upcoming_matches():
    return respond("upcoming")


@app.get("/api/matches/recent")
def recent_results():
    return respond("ended")


@app.get("/api/series/upcoming")
def upcoming_series():
    try:
        rows, fetched_at = get_all("series", ttl=3600, max_pages=2)
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"Cricket API error: {error}")

    today = date.today().isoformat()
    result = []
    for s in rows:
        start = str(s.get("startDate") or "")
        has_tests = (s.get("test") or 0) > 0
        if has_tests and len(start) == 10 and start >= today:
            result.append(s)
    result.sort(key=lambda s: s["startDate"])
    return {"count": len(result), "updated_at": fetched_at, "series": result}


@app.get("/api/series/{series_id}")
def series_detail(series_id: str):
    try:
        data = fetch("series_info", {"id": series_id}, ttl=3600)
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"Cricket API error: {error}")
    return data.get("data")


@app.get("/api/match/{match_id}/scorecard/raw")
def match_scorecard_raw(match_id: str):
    try:
        data = fetch("match_scorecard", {"id": match_id}, ttl=300)
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"Cricket API error: {error}")
    return data.get("data")


@app.get("/api/match/{match_id}/scorecard")
def scorecard_view(match_id: str):
    try:
        data = fetch("match_scorecard", {"id": match_id}, ttl=300)
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"Cricket API error: {error}")
    result = clean_scorecard(data.get("data"))
    result["updated_at"] = data.get("_fetched_at")
    return result
