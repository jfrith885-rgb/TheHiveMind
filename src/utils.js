export function getShowId() {
  const url = new URL(window.location.href);
  const fromParam = url.searchParams.get("h");
  if (fromParam && fromParam.length >= 6) {
    localStorage.setItem("hivemind_show_id", fromParam);
    return fromParam;
  }
  const stored = localStorage.getItem("hivemind_show_id");
  if (stored) return stored;

  const gen = crypto?.randomUUID?.() ? crypto.randomUUID().slice(0, 10) : Math.random().toString(36).slice(2, 12);
  localStorage.setItem("hivemind_show_id", gen);
  return gen;
}

export function makeClientToken() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
