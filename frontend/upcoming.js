(function () {
  const BASE = "http://127.0.0.1:8000";
  const DEMO = new URLSearchParams(location.search).get("demo") === "1";
  const MAX_TESTS = 10; // a "series" with more Tests than this is probably a domestic league

  function esc(text) {
    const div = document.createElement("div");
    div.textContent = text == null ? "" : String(text);
    return div.innerHTML;
  }

  const ISO = /^\d{4}-\d{2}-\d{2}$/;
  function day(iso) { return new Date(iso + "T00:00:00Z"); }
  function fmt(iso) {
    if (!ISO.test(iso || "")) return "";
    return day(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  }
  function daysUntil(iso) { return Math.ceil((day(iso) - Date.now()) / 86400000); }

  async function getJson(path, demoFile) {
    const response = await fetch(DEMO ? `demo/${demoFile}` : BASE + path);
    if (!response.ok) throw new Error(`Server replied ${response.status}`);
    return response.json();
  }

  function seriesCard(s) {
    const n = daysUntil(s.startDate);
    const when = n > 1 ? `Starts in ${n} days` : n === 1 ? "Starts tomorrow" : "Starts today";
    const end = s.endDate ? ` &ndash; ${esc(s.endDate)}` : "";
    const formats = [`${s.test} Test${s.test === 1 ? "" : "s"}`];
    if (s.odi) formats.push(`${s.odi} ODI${s.odi === 1 ? "" : "s"}`);
    if (s.t20) formats.push(`${s.t20} T20I${s.t20 === 1 ? "" : "s"}`);
    return `<div class="card series" data-id="${esc(s.id)}">
      <div class="league">${esc(when)}</div>
      <div class="title">${esc(s.name)}</div>
      <div class="venue">${esc(fmt(s.startDate))}${end} &middot; ${esc(formats.join(", "))}</div>
      <button class="fix-btn" type="button">Show Test fixtures</button>
      <div class="fixtures" hidden></div>
    </div>`;
  }

  function fixtureRows(list) {
    const tests = list
      .filter((m) => /\btest\b/i.test(m.name || "") && !/warm-?up|unofficial/i.test(m.name || ""))
      .sort((a, b) => (a.dateTimeGMT || "").localeCompare(b.dateTimeGMT || ""));
    if (!tests.length) return '<p class="small">No Test fixtures are listed for this series yet.</p>';
    return tests.map((m) => {
      const title = (m.name || "").split(",").slice(0, 2).map((x) => esc(x.trim())).join(" &middot; ");
      return `<div class="fix-row">
        <span class="d">${esc(fmt(m.date))}</span>
        <div>${title}</div>
        <div class="v">${esc(m.venue)}</div>
      </div>`;
    }).join("");
  }

  document.getElementById("upcoming").addEventListener("click", async (event) => {
    const btn = event.target.closest(".fix-btn");
    if (!btn) return;
    const card = btn.closest(".series");
    const box = card.querySelector(".fixtures");

    if (box.dataset.loaded) {  // already loaded: just show or hide
      box.hidden = !box.hidden;
      btn.textContent = box.hidden ? "Show Test fixtures" : "Hide fixtures";
      return;
    }
    if (DEMO) {
      box.innerHTML = '<p class="small">Fixtures are not part of the demo data. Open the page without ?demo=1 once the API limit has reset.</p>';
      box.dataset.loaded = "1";
      box.hidden = false;
      btn.textContent = "Hide fixtures";
      return;
    }

    btn.disabled = true;
    btn.textContent = "Loading...";
    try {
      const data = await getJson(`/api/series/${encodeURIComponent(card.dataset.id)}`);
      box.innerHTML = fixtureRows(data.matchList || []);
      box.dataset.loaded = "1";
      box.hidden = false;
      btn.textContent = "Hide fixtures";
    } catch (error) {
      box.innerHTML = `<span class="error">Could not load fixtures: ${esc(error.message)}</span>`;
      box.hidden = false;
      btn.textContent = "Try again";
    }
    btn.disabled = false;
  });

  async function loadUpcoming() {
    const box = document.getElementById("upcoming");
    const note = document.getElementById("upcoming-note");
    try {
      const data = await getJson("/api/series/upcoming", "series.json");
      const seen = new Set();
      const list = (data.series || [])
        .filter((s) => {
          if (!ISO.test(s.startDate || "") || (s.test || 0) < 1 || s.test > MAX_TESTS) return false;
          const key = (s.name || "").trim().toLowerCase();  // hides duplicate entries of one series
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .sort((a, b) => a.startDate.localeCompare(b.startDate));

      if (data.updated_at) {
        const time = new Date(data.updated_at * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        note.textContent = `Series list last fetched at ${time}. Dates come from a free feed and can be wrong, so check with the cricket boards before planning.`;
      }
      box.innerHTML = list.length ? list.map(seriesCard).join("") : "No upcoming Test series found.";
    } catch (error) {
      box.innerHTML = `<span class="error">Could not load series: ${esc(error.message)}. If the API limit is reached, add ?demo=1 to the address.</span>`;
    }
  }

  loadUpcoming();
})();
