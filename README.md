# Test Cricket Live Tracker

A free web app for following international Test cricket: live scores, recent results, upcoming series, full scorecards and the World Test Championship race. Built from scratch as a learning project.

> **Status:** works locally. Deployment to Netlify and Render is planned but not done yet.

## Features

- **Live Tests:** international Tests in play, with a score per innings, session status and series result
- **Results:** finished Tests from the last 5 days
- **Upcoming:** upcoming Test series, with fixtures per series
- **WTC Race:** World Test Championship table with PCT, points rules and the final date
- **Scorecards:** batting and bowling figures for each innings
- **Demo mode:** add `?demo=1` to the address to use saved sample data and spend no API requests
- Responsive, dark layout

## Tech stack

| Part | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript (no frameworks) |
| Backend | Python, FastAPI, Uvicorn |
| Live scores, results | [Highlightly](https://highlightly.net) cricket API (free plan) |
| Scorecards, series | [CricketData.org](https://cricketdata.org) API (free plan) |
| Planned hosting | Netlify (frontend), Render (backend) |

Two APIs are used on purpose: Highlightly was fresher for live scores in testing, while only CricketData.org returned full batting and bowling figures on the free plan.

## Project structure

```
TestCricket/
├── backend/
│   ├── main.py                # FastAPI app and routes
│   ├── cricket_client.py      # CricketData.org calls, file cache, pause after failure
│   ├── highlightly_client.py  # Highlightly calls, file cache, live and results filters
│   ├── scorecard.py           # Cleans the raw scorecard data
│   ├── series_summary.py      # Works out a series result from match statuses
│   ├── requirements.txt
│   └── .env.example           # Template for your API keys
└── frontend/
    ├── index.html, match.html
    ├── api.js                 # Backend address and demo-mode switch
    ├── app.js                 # Live tab
    ├── results.js             # Results tab
    ├── upcoming.js            # Upcoming tab
    ├── wtc.js                 # Tab switching and WTC table
    ├── match.js               # Scorecard page
    ├── style.css
    ├── data/wtc.json          # WTC standings (edited by hand)
    └── demo/                  # Saved sample data for demo mode
```

## Run it locally

You need Python 3.10 or newer and free API keys from [Highlightly](https://highlightly.net) and [CricketData.org](https://cricketdata.org).

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Open `.env` and replace both placeholders with your real keys. Never commit this file.

```bash
uvicorn main:app --reload
```

The API runs at http://127.0.0.1:8000, with interactive docs at http://127.0.0.1:8000/docs.

### 2. Frontend

In a second terminal tab:

```bash
cd frontend
python3 -m http.server 5500
```

Open http://127.0.0.1:5500, or http://127.0.0.1:5500/?demo=1 for demo mode.

## API endpoints

| Endpoint | Returns |
|---|---|
| `GET /api/live` | International Tests in play (Highlightly) |
| `GET /api/results` | Finished Tests from the last 5 days (Highlightly) |
| `GET /api/series/upcoming` | Upcoming series that include Tests |
| `GET /api/series/{id}` | Fixtures and results for one series |
| `GET /api/series/{id}/summary` | Series result, such as "West Indies lead 1-0" |
| `GET /api/match/{id}/scorecard` | Cleaned scorecard for one match |
| `GET /api/match/{id}/scorecard/raw` | Unprocessed scorecard (for debugging) |
| `GET /api/matches/live`, `/upcoming`, `/recent` | Older CricketData.org match lists |

## Good to know

- **Both free plans allow about 100 requests a day.** The backend caches replies in files (`cache.json`, `highlightly_cache.json`, both git-ignored): live data for 5 minutes, yesterday's results for 6 hours and older days for 24 hours; CricketData match lists for 15 minutes, series for 1 hour, scorecards for 5 minutes. After a failed CricketData call it waits 30 minutes before trying that call again, and serves saved data in the meantime.
- **Scores can lag the live game.** In testing, Highlightly ran about one over behind Cricbuzz, and CricketData.org was sometimes a whole session behind. The page shows when the data was last fetched.
- **Series results can be wrong when the feed lags.** If a Test is more than 5 days old and still "in progress" in the data, the summary says so instead of presenting a final score.
- **International Tests are picked by format `TEST` and country `World`.** That worked in testing but is an assumption, not a documented rule.
- **The WTC table is a manual snapshot** from ESPN and ESPNcricinfo. It may be out of date, so check it against the official ICC table and edit `frontend/data/wtc.json`.
- **The backend address is hardcoded** as `http://127.0.0.1:8000` in `api.js`, `results.js` and `upcoming.js`. It must change for deployment.
- **CORS is open (`*`) for development.** Restrict it to your Netlify address before deploying.

## Roadmap

- [ ] Move the backend address into one config file
- [ ] Deploy the backend (Render) and frontend (Netlify), and restrict CORS
- [ ] Series result on the Upcoming tab
- [ ] Test on real phones

## Data credit

Cricket data is provided by [Highlightly](https://highlightly.net) and [CricketData.org](https://cricketdata.org) under their terms of use.
