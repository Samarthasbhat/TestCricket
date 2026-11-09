import os
import httpx
from dotenv import load_dotenv

load_dotenv()
r = httpx.get(
    "https://api.cricapi.com/v1/match_scorecard",
    params={"apikey": os.getenv("CRICKET_API_KEY"),
            "id": "29f0a681-bd9b-40c4-af2d-cae8b5ad4efb"},
    timeout=15,
).json()
d = r.get("data") or {}
print("status:", d.get("status"))
print("score:", [(s.get("inning"), s.get("r"), s.get("w"), s.get("o")) for s in d.get("score", [])])
print("innings in scorecard:", len(d.get("scorecard", [])))
print("usage:", r.get("info", {}).get("hitsToday"), "/", r.get("info", {}).get("hitsLimit"))
