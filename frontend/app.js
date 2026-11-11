function teamRow(t) {
  const logo = t.logo ? `<img src="${esc(t.logo)}" alt="${esc(t.short)}">` : "";
  const score = t.score ? esc(t.score) : "Yet to bat";
  const info = t.info ? `<span class="info">${esc(t.info)}</span>` : "";
  return `<div class="team-row">${logo}<span class="tname">${esc(t.name)}</span>
    <span class="tscore"><strong>${score}</strong>${info}</span></div>`;
}

function matchCard(m) {
  const body = `
    <div class="league">${esc(m.league)}</div>
    <div class="state">${esc(m.state)}</div>
    ${teamRow(m.home)}${teamRow(m.away)}
    <div class="status">${esc(m.report)}</div>
    <div class="venue">${esc(m.venue)}</div>
    ${m.scorecard_id ? '<div class="more">View full scorecard &rarr;</div>' : ""}`;
  if (!m.scorecard_id) return `<div class="card">${body}</div>`;
  const href = `match.html?id=${encodeURIComponent(m.scorecard_id)}${DEMO ? "&demo=1" : ""}`;
  return `<a class="card" href="${href}">${body}</a>`;
}

function showUpdated(seconds) {
  const note = document.getElementById("updated");
  if (!seconds) { note.textContent = ""; return; }
  const time = new Date(seconds * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  note.textContent = `Live data last fetched at ${time}. Scores can run a few overs behind the live game, and full scorecards come from a different feed that can lag more.`;
}

async function loadLive() {
  const box = document.getElementById("live");
  try {
    const data = await api("/api/live", "live.json");
    showUpdated(data.updated_at);
    box.innerHTML = data.count
      ? data.matches.map(matchCard).join("")
      : "No Test match is live right now.";
  } catch (error) {
    box.innerHTML = `<span class="error">Could not load matches: ${esc(error.message)}</span>`;
  }
}

loadLive();

// Re-check every 2 minutes (the backend cache decides if the API is called).
setInterval(() => { if (!document.hidden) loadLive(); }, 120000);
