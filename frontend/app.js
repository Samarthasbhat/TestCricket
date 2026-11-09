const API_BASE = "http://127.0.0.1:8000";

function esc(text) {
  const div = document.createElement("div");
  div.textContent = text == null ? "" : String(text);
  return div.innerHTML;
}

function shortName(match, teamName) {
  const info = (match.teamInfo || []).find((t) => t.name === teamName);
  return info ? info.shortname : teamName;
}

function scoreLines(m) {
  const lines = (m.score || []).map((s) => {
    const overs = s.o != null ? ` (${s.o} ov)` : "";
    return `<div class="score-line"><span>${esc(shortName(m, s.team))}</span><strong>${s.r}/${s.w}${overs}</strong></div>`;
  });
  return lines.join("") || "Yet to start";
}

function matchCard(m) {
  const logos = (m.teamInfo || [])
    .map((t) => `<img src="${esc(t.img)}" alt="${esc(t.shortname)}">`)
    .join("");
  return `
    <a class="card" href="match.html?id=${encodeURIComponent(m.id)}">
      <div class="title">${esc(m.name)}</div>
      <div class="teams">${logos}<span>${esc((m.teams || []).join(" vs "))}</span></div>
      <div class="scores">${scoreLines(m)}</div>
      <div class="status">${esc(m.status)}</div>
      <div class="venue">${esc(m.venue)}</div>
    </a>`;
}

function showUpdated(seconds) {
  const note = document.getElementById("updated");
  if (!seconds) { note.textContent = ""; return; }
  const time = new Date(seconds * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  note.textContent = `Last fetched from the cricket feed at ${time}. This free feed can lag the live game by many overs.`;
}

async function loadLive() {
  const box = document.getElementById("live");
  try {
    const response = await fetch(`${API_BASE}/api/matches/live`);
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
