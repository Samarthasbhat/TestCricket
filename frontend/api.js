const API_BASE = "http://127.0.0.1:8000";
const DEMO = new URLSearchParams(window.location.search).get("demo") === "1";

function esc(text) {
  const div = document.createElement("div");
  div.textContent = text == null ? "" : String(text);
  return div.innerHTML;
}

// Fetch JSON from the backend, or from a saved file when ?demo=1 is in the address.
async function api(path, demoFile) {
  const url = DEMO ? `demo/${demoFile}` : `${API_BASE}${path}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Server replied ${response.status}`);
  return response.json();
}

if (DEMO) {
  const bar = document.createElement("div");
  bar.textContent = "Demo mode: saved sample data, not live scores.";
  bar.style.cssText = "background:#fff3cd;color:#664d03;text-align:center;padding:0.4rem;font-size:0.85rem;";
  document.body.prepend(bar);
}
