import os
import httpx
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("CRICKET_API_KEY")

if not api_key:
    print("No API key found. Check your .env file.")
    raise SystemExit

response = httpx.get(
    "https://api.cricapi.com/v1/currentMatches",
    params={"apikey": api_key, "offset": 0},
    timeout=15,
)

data = response.json()

print("Status:", data.get("status"))
matches = data.get("data", [])
print("Matches returned:", len(matches))
for match in matches[:5]:
    print("-", match.get("name"), "|", match.get("matchType"))
print("Usage info:", data.get("info"))