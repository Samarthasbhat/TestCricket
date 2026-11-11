(function () {
  // A team within this many PCT points of 2nd place is shown as "In contention".
  const IN_CONTENTION = 10;

  function esc(text) {
    const div = document.createElement("div");
    div.textContent = text == null ? "" : String(text);
    return div.innerHTML;
  }

  function showTab(name) {
    document.querySelectorAll(".tab-btn").forEach((b) =>
      b.classList.toggle("active", b.dataset.tab === name));
    document.querySelectorAll(".tab-panel").forEach((p) => {
      p.hidden = p.id !== "tab-" + name;
    });
    history.replaceState(null, "", name === "live" ? location.pathname + location.search : "#" + name);
  }

  document.querySelectorAll(".tab-btn").forEach((b) =>
    b.addEventListener("click", () => showTab(b.dataset.tab)));
  const startTab = location.hash.slice(1);
  if (startTab === "wtc" || startTab === "upcoming") showTab(startTab);

  function longDate(iso) {
    return new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });
  }

  function infoHtml(data) {
    const p = data.points || {};
    const f = data.final || {};
    const chips = [["Win", p.win], ["Tie", p.tie], ["Draw", p.draw], ["Loss", p.loss]]
      .filter(([, v]) => v != null)
      .map(([label, v]) => `<span class="pt"><b>${esc(label)}</b> ${esc(v)}</span>`)
      .join("");

    let finalLine = "";
    if (f.start) {
      const days = Math.ceil((new Date(f.start + "T00:00:00Z") - Date.now()) / 86400000);
      const dates = f.end ? `${longDate(f.start)} &ndash; ${longDate(f.end)} ${esc(f.start.slice(0, 4))}`
                          : `${longDate(f.start)} ${esc(f.start.slice(0, 4))}`;
      const venue = f.venue ? ` &middot; ${esc(f.venue)}` : "";
      const left = days > 0 ? ` &middot; ${days} days to go` : "";
      finalLine = `<p class="final-line"><b>WTC Final</b> ${dates}${venue}${left}</p>`;
    }

    return `<div class="wtc-info">
      <div class="pts">${chips}</div>
      <p class="small">Points per match. A team loses 1 point for each over it bowls short of the required rate. Teams are ranked by PCT (points won as a share of points contested), and the top two reach the final.</p>
      ${finalLine}
    </div>`;
  }

  async function loadWtc() {
    const box = document.getElementById("wtc");
    try {
      const response = await fetch("data/wtc.json");
      if (!response.ok) throw new Error(`Server replied ${response.status}`);
      const data = await response.json();
      document.getElementById("wtc-note").textContent = data.note || "";
      box.insertAdjacentHTML("beforebegin", infoHtml(data));

      const rows = data.teams
        .map((t) => ({ ...t, pct: t.m ? (t.pts / (t.m * 12)) * 100 : 0 }))
        .sort((a, b) => b.pct - a.pct);
      const second = rows[1].pct;

      const body = rows.map((t, i) => {
        const behind = (second - t.pct).toFixed(1);
        let tag;
        if (i < 2) tag = '<span class="tag final">In final position</span>';
        else if (second - t.pct <= IN_CONTENTION) tag = `<span class="tag near">In contention &middot; ${behind} behind 2nd</span>`;
        else tag = `<span class="tag far">${behind} behind 2nd</span>`;
        return `<tr>
          <td>${i + 1}. <span class="tm">${esc(t.team)}</span>${tag}</td>
          <td>${esc(t.m)}</td><td>${esc(t.w)}</td><td>${esc(t.l)}</td><td>${esc(t.d)}</td>
          <td>${esc(t.pts)}</td><td><strong>${t.pct.toFixed(2)}</strong></td>
        </tr>`;
      }).join("");

      box.innerHTML = `<div class="table-wrap"><table>
        <tr><th>Team</th><th>M</th><th>W</th><th>L</th><th>D</th><th>Pts</th><th>PCT</th></tr>${body}
      </table></div>`;
    } catch (error) {
      box.innerHTML = `<span class="error">Could not load the table: ${esc(error.message)}</span>`;
    }
  }

  loadWtc();
})();
