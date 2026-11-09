# Test Cricket Live Tracker

A free, responsive web app for following Test cricket: live Test matches, full scorecards with batting and bowling figures, and upcoming series. Built from scratch as a learning project.

> **Status:** work in progress. The live Tests page and scorecards work locally. Upcoming series and recent results are available in the API but not yet on the home page. Deployment to Netlify and Render is planned.

## Features

- Live Test matches with a team-labelled score for each innings
- Full scorecards: batting (runs, balls, 4s, 6s, strike rate, dismissal) and bowling (overs, maidens, runs, wickets, economy)
- Upcoming Test series, sorted by start date
- Recent Test results
- Responsive layout that works on phones and laptops
- "Last fetched" time shown on the page, because the free data feed can lag

## Tech stack

| Part | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript (no frameworks) |
| Backend | Python, FastAPI, Uvicorn |
| Data | [CricketData.org](https://cricketdata.org) API (free plan) |
| Planned hosting | Netlify (frontend), Render (backend) |

## Project structure

```
TestCricket/
├── backend/
│   ├── main.py            # FastAPI app and API routes
│   ├── cricket_client.py  # API calls with a file-based cache
│   ├── scorecard.py       # Cleans the raw scorecard data
│   ├── requirements.txt   # Python packages
│   └── .env.example       # Template for your API key
└── frontend/
    ├── index.html         # Live matches page
    ├── match.html         # Scorecard page
    ├── app.js
    ├── match.js
    └── style.css
```

## Run it locally

You need Python 3.10 or newer and a free API key from [cricketdata.org](https://cricketdata.org).

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Open `.env` and replace the placeholder with your real key. Never commit this file.

```bash
uvicorn main:app --reload
```

The API runs at http://127.0.0.1:8000. Interactive docs are at http://127.0.0.1:8000/docs.

### 2. Frontend

In a second terminal tab:

```bash
cd frontend
python3 -m http.server 5500
```

Open http://127.0.0.1:5500.

## API endpoints

| Endpoint | Returns |
|---|---|
| `GET /api/matches/live` | Test matches in progress |
| `GET /api/matches/upcoming` | Test matches that have not started (from the current-matches feed) |
| `GET /api/matches/recent` | Recently finished Tests |
| `GET /api/series/upcoming` | Upcoming series that include Tests |
| `GET /api/series/{series_id}` | Fixtures and results for one series |
| `GET /api/match/{match_id}/scorecard` | Cleaned scorecard for one match |
| `GET /api/match/{match_id}/scorecard/raw` | Unprocessed scorecard from the API (for debugging) |

## Good to know

- **The free plan allows 100 API requests per day.** The backend caches responses (15 minutes for match lists, 1 hour for series, 5 minutes for scorecards) and saves the cache to `backend/cache.json`, so restarting the server does not use requests. If the API fails or the limit is reached, the last saved data is served instead.
- **Scores can lag the live game.** The free feed updates slowly, sometimes by many overs, and the status text can be out of date. The page shows when the data was last fetched.
- **Some data is messy.** Innings labels and team names are cleaned in `scorecard.py`. Unofficial and warm-up matches are filtered out by name.
- **CORS is open (`*`) for development.** Restrict it to your Netlify address before deploying.

## Roadmap

- [ ] Upcoming series and recent results on the home page
- [ ] Series pages with results and standings
- [ ] Restrict CORS and deploy (Render backend, Netlify frontend)
- [ ] Updated-at note on the scorecard page

## Data credit

Cricket data is provided by [CricketData.org](https://cricketdata.org) under their terms of use.
