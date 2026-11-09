const API_BASE = "http://127.0.0.1:8000";

function esc(text) {
  const div = document.createElement("div");
  div.textContent = text == null ? "" : String(text);
  return div.innerHTML;
}

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
  return m.scorecard_id
    ? `<a class="card" href="match.html?id=${encodeURIComponent(m.scorecard_id)}">${body}</a>`
    : `<div class="card">${body}</div>`;
}

function showUpdated(seconds) {
  const note = document.getElementById("updated");
  if (!seconds) { note.textContent = ""; return; }
  const time = new Date(seconds * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  note.textContent = `Live data last fetched at ${time} (refreshed at most every 10 minutes). Full scorecards come from a different feed and can lag.`;
}

async function loadLive() {
  const box = document.getElementById("live");
  try {
    const response = await fetch(`${API_BASE}/api/live`);
    if (!response.ok) throw new Error(`Server replied ${response.status}`);
    const data = await response.json();
    showUpdated(data.updated_at);
    box.innerHTML = data.count
      ? data.matches.map(matchCard).join("")
      : "No Test match is live right now.";
  } catch (error) {
    box.innerHTML = `<span class="error">Could not load matches: ${esc(error.message)}</span>`;
  }
}

loadLive();
