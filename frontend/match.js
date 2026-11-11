function battingTable(rows) {
  const body = rows.map((b) => `
    <tr>
      <td>${esc(b.name)}${b.not_out ? "*" : ""}<span class="how">${esc(b.how_out)}</span></td>
      <td><strong>${esc(b.runs)}</strong></td><td>${esc(b.balls)}</td>
      <td>${esc(b.fours)}</td><td>${esc(b.sixes)}</td><td>${esc(b.strike_rate)}</td>
    </tr>`).join("");
  return `<div class="table-wrap"><table>
    <tr><th>Batter</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr>${body}</table></div>`;
}

function bowlingTable(rows) {
  const body = rows.map((b) => `
    <tr>
      <td>${esc(b.name)}</td><td>${esc(b.overs)}</td><td>${esc(b.maidens)}</td>
      <td>${esc(b.runs)}</td><td><strong>${esc(b.wickets)}</strong></td><td>${esc(b.economy)}</td>
    </tr>`).join("");
  return `<div class="table-wrap"><table>
    <tr><th>Bowler</th><th>O</th><th>M</th><th>R</th><th>W</th><th>Econ</th></tr>${body}</table></div>`;
}

function ordinal(n) { return n === 1 ? "1st" : n === 2 ? "2nd" : `${n}th`; }

function render(d) {
  const innings = d.innings.map((i) => `
    <section class="innings">
      <h3>${esc(i.team)} - ${ordinal(i.innings_no)} innings: ${esc(i.total)}/${esc(i.wickets)} (${esc(i.overs)} ov)</h3>
      ${battingTable(i.batting)}
      <p>Extras (calculated): ${esc(i.extras)}</p>
      ${bowlingTable(i.bowling)}
    </section>`).join("");

  return `
    <div class="card summary">
      <div class="title">${esc(d.name)}</div>
      <div class="status">${esc(d.status)}</div>
      <div class="venue">${esc(d.venue)}${d.toss ? " · " + esc(d.toss) : ""}</div>
    </div>
    ${innings || "No scorecard is available yet."}`;
}

async function load() {
  const box = document.getElementById("content");
  document.querySelector(".back").href = "index.html" + (DEMO ? "?demo=1" : "");
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) { box.textContent = "No match selected."; return; }
  try {
    const data = await api(`/api/match/${encodeURIComponent(id)}/scorecard`, "scorecard.json");
    box.innerHTML = render(data);
  } catch (error) {
    box.innerHTML = `<span class="error">Could not load scorecard: ${esc(error.message)}</span>`;
  }
}

load();
