def _name(player):
    return (player or {}).get("name")


def _batting_team(label, teams, previous):
    """Work out who batted from the API's messy innings label."""
    text = (label or "").rsplit(" Inning", 1)[0]
    names = [t.strip() for t in text.split(",") if t.strip()]
    lookup = {t.lower(): t for t in teams}
    found = [lookup[n.lower()] for n in names if n.lower() in lookup]
    if len(found) == 1:
        return found[0]
    if len(found) == 2 and previous in found:
        return found[0] if found[1] == previous else found[1]
    return text or "Unknown"


def _batter(entry):
    text = entry.get("dismissal-text") or ""
    return {
        "name": _name(entry.get("batsman")),
        "runs": entry.get("r"),
        "balls": entry.get("b"),
        "fours": entry.get("4s"),
        "sixes": entry.get("6s"),
        "strike_rate": entry.get("sr"),
        "how_out": text,
        "not_out": text.lower() in ("not out", "batting"),
    }


def _bowler(entry):
    return {
        "name": _name(entry.get("bowler")),
        "overs": entry.get("o"),
        "maidens": entry.get("m"),
        "runs": entry.get("r"),
        "wickets": entry.get("w"),
        "no_balls": entry.get("nb"),
        "wides": entry.get("wd"),
        "economy": entry.get("eco"),
    }


def clean_scorecard(raw):
    """Turn the API's scorecard into a tidy structure for our frontend."""
    raw = raw or {}
    teams = raw.get("teams") or []
    scores = raw.get("score") or []
    innings = []
    previous = None
    seen = {}

    for i, inn in enumerate(raw.get("scorecard") or []):
        team = _batting_team(inn.get("inning"), teams, previous)
        previous = team
        seen[team] = seen.get(team, 0) + 1

        batting = [_batter(b) for b in inn.get("batting") or []]
        bowling = [_bowler(b) for b in inn.get("bowling") or []]

        total = scores[i] if i < len(scores) else {}
        total_runs = total.get("r")
        bat_runs = sum(b["runs"] or 0 for b in batting)
        extras = total_runs - bat_runs if total_runs is not None else None

        innings.append({
            "team": team,
            "innings_no": seen[team],
            "total": total_runs,
            "wickets": total.get("w"),
            "overs": total.get("o"),
            "extras": extras,
            "batting": batting,
            "bowling": bowling,
        })

    toss = None
    if raw.get("tossWinner") and raw.get("tossChoice"):
        toss = f"{raw['tossWinner'].title()} chose to {raw['tossChoice']}"

    return {
        "id": raw.get("id"),
        "name": raw.get("name"),
        "status": raw.get("status"),
        "venue": raw.get("venue"),
        "date": raw.get("date"),
        "teams": teams,
        "toss": toss,
        "innings": innings,
    }


def label_scores(match):
    """Add a 'team' field to each entry of match['score']."""
    teams = match.get("teams") or []
    previous = None
    labelled = []
    for entry in match.get("score") or []:
        team = _batting_team(entry.get("inning"), teams, previous)
        previous = team
        labelled.append({**entry, "team": team})
    match["score"] = labelled
    return match
