(function () {
  const BASE = "http://127.0.0.1:8000";
  const DEMO = new URLSearchParams(location.search).get("demo") === "1";
  let loaded = false;

  function esc(text) {
    const div = document.createElement("div");
    div.textContent = text == null ? "" : String(text);
    return div.innerHTML;
  }

  function shortDate(iso) {
    return new Date(iso.slice(0, 10) + "T00:00:00Z")
      .toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  }

  function range(start, end) {
    if (!start) return "";
    const year = start.slice(0, 4);
    if (end && end.slice(0, 10) !== start.slice(0, 10)) {
      return `${shortDate(start)} &ndash; ${shortDate(end)} ${year}`;
    }
    return `${shortDate(start)} ${year}`;
  }

  function teamRow(t) {
    const logo = t.logo ? `<img src="${esc(t.logo)}" alt="${esc(t.short)}">` : "";
    return `<div class="team-row">${logo}<span class="tname">${esc(t.name)}</span>
      <span class="tscore"><strong>${t.score ? esc(t.score) : "&ndash;"}</strong></span></div>`;
  }

  function resultCard(m) {
    const body = `
      <div class="league">${esc(m.league)}</div>
      <div class="state done">${esc(m.state)}</div>
      ${teamRow(m.home)}${teamRow(m.away)}
      <div class="status">${esc(m.report)}</div>
      <div class="venue">${esc(m.venue)} &middot; ${range(m.start, m.end)}</div>
      ${m.scorecard_id ? '<div class="more">View full scorecard &rarr;</div>' : ""}`;
    if (!m.scorecard_id) return `<div class="card">${body}</div>`;
    const href = `match.html?id=${encodeURIComponent(m.scorecard_id)}${DEMO ? "&demo=1" : ""}`;
    return `<a class="card" href="${href}">${body}</a>`;
  }

  async function load() {
    const box = document.getElementById("results");
    const note = document.getElementById("results-note");
    try {
      const response = await fetch(DEMO ? "demo/results.json" : BASE + "/api/results");
      if (!response.ok) throw new Error(`Server replied ${response.status}`);
      const data = await response.json();

      let text = "International Tests that finished in the last 5 days.";
      if (data.updated_at) {
        const time = new Date(data.updated_at * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        text += ` Last fetched at ${time}.`;
      }
      if (data.missed_days) text += ` ${data.missed_days} day(s) could not be loaded, so the list may be incomplete.`;
      note.textContent = text;

      box.innerHTML = data.count
        ? data.matches.map(resultCard).join("")
        : "No international Tests finished in the last 5 days.";
    } catch (error) {
      loaded = false;  // let the person try again by reopening the tab
      box.innerHTML = `<span class="error">Could not load results: ${esc(error.message)}</span>`;
    }
  }

  function ensureLoaded() {
    if (loaded) return;
    loaded = true;
    load();
  }

  document.querySelectorAll('.tab-btn[data-tab="results"]').forEach((b) => b.addEventListener("click", ensureLoaded));
  if (location.hash === "#results") ensureLoaded();
})();
