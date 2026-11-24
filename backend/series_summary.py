import re
from datetime import date


def _is_real_test(match):
    name = (match.get("name") or "").lower()
    if re.search(r"warm-?up|unofficial|tour match", name):
        return False
    return re.search(r"\btest\b", name) is not None


def _days_since(iso_date):
    try:
        return (date.today() - date.fromisoformat((iso_date or "")[:10])).days
    except ValueError:
        return 0


def summarise(series_data):
    """Work out a series result from the status line of each Test."""
    tests = [m for m in series_data.get("matchList") or [] if _is_real_test(m)]
    wins = {}
    draws = ties = in_progress = upcoming = outdated = 0

    for m in tests:
        status = (m.get("status") or "").strip()
        low = status.lower()
        if not m.get("matchStarted"):
            upcoming += 1
        elif " won by " in low:
            winner = status[: low.index(" won by ")].strip()
            wins[winner] = wins.get(winner, 0) + 1
        elif "drawn" in low:
            draws += 1
        elif "tied" in low:
            ties += 1
        elif _days_since(m.get("date")) > 5:
            outdated += 1  # a Test cannot last this long, so the feed is behind
        else:
            in_progress += 1

    ranked = sorted(wins.items(), key=lambda kv: kv[1], reverse=True)
    top = ranked[0] if ranked else None
    second_wins = ranked[1][1] if len(ranked) > 1 else 0
    complete = bool(tests) and in_progress == 0 and upcoming == 0 and outdated == 0

    if not tests:
        headline = "No Tests listed for this series"
    elif top is None and draws == 0 and ties == 0:
        headline = "In progress" if in_progress else "Yet to start"
    elif top is None:
        headline = "Series drawn" if complete else "Series level, all finished matches drawn"
    elif top[1] == second_wins:
        headline = f"Series {'drawn' if complete else 'level'} {top[1]}-{second_wins}"
    elif complete:
        headline = f"{top[0]} won the series {top[1]}-{second_wins}"
    else:
        headline = f"{top[0]} lead {top[1]}-{second_wins}"

    note = None
    if outdated:
        note = "The feed has not updated the latest Test's result yet, so this score may be missing a finished match."

    return {
        "name": (series_data.get("info") or {}).get("name"),
        "headline": headline,
        "note": note,
        "tests": len(tests),
        "wins": wins,
        "draws": draws,
        "ties": ties,
        "in_progress": in_progress,
        "upcoming": upcoming,
        "outdated": outdated,
        "complete": complete,
    }
