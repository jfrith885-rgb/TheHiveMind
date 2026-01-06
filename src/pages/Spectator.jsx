import { useEffect, useMemo, useState } from "react";
import { getShowId, makeClientToken, sleep } from "../utils";

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

export default function Spectator() {
  const [phase, setPhase] = useState("input"); // input | syncing | sealed | revealing | complete
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");

  const [entryId, setEntryId] = useState(() => localStorage.getItem("hivemind_entry_id") || "");
  const [clientToken, setClientToken] = useState(() => localStorage.getItem("hivemind_client_token") || "");

  const [revealed, setRevealed] = useState("");
  const cooldownMs = 110;

  const showId = useMemo(() => getShowId(), []);
  const trimmed = useMemo(() => text.trim(), [text]);

  useEffect(() => {
    const saved = localStorage.getItem("hivemind_last_text");
    if (!text && saved) setText(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem("hivemind_last_text", text);
  }, [text]);

  async function submit() {
    setStatus("");
    if (!trimmed) return setStatus("Enter a word, name, or phrase.");

    setPhase("syncing");

    const tok = clientToken || makeClientToken();
    setClientToken(tok);
    localStorage.setItem("hivemind_client_token", tok);

    try {
      const r = await fetch("/.netlify/functions/create-entry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ show_id: showId, entry_text: trimmed, client_token: tok }),
      });

      const payloadText = await r.text();
      let payload = null;
      try { payload = payloadText ? JSON.parse(payloadText) : null; } catch {}

      if (!r.ok) {
        setPhase("input");
        return setStatus(payload?.error || payloadText || "Transmission failed. Try again.");
      }

      const id = payload?.id;
      if (!id) {
        setPhase("input");
        return setStatus("Transmission failed (no id). Check server config.");
      }

      setEntryId(id);
      localStorage.setItem("hivemind_entry_id", id);

      setPhase("sealed");
      setStatus("Sealed. Place the device face-down.");
    } catch {
      setPhase("input");
      setStatus("Network error. Try again.");
    }
  }

  useEffect(() => {
    if (phase !== "sealed") return;
    if (!entryId || !clientToken) return;

    let alive = true;

    const tick = async () => {
      try {
        const r = await fetch(
          `/.netlify/functions/get-entry-status?id=${encodeURIComponent(entryId)}&t=${encodeURIComponent(clientToken)}`
        );
        if (!r.ok) return;
        const j = await r.json().catch(() => null);
        if (!alive) return;
        if (j?.reveal_ready) setPhase("revealing");
      } catch {}
    };

    tick();
    const id = setInterval(tick, 800);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [phase, entryId, clientToken]);

  useEffect(() => {
    if (phase !== "revealing") return;
    const target = trimmed || text.trim();

    let alive = true;
    (async () => {
      setRevealed("");
      await sleep(500);
      for (let i = 0; i < target.length; i++) {
        if (!alive) return;
        setRevealed((prev) => prev + target[i]);

        const base = cooldownMs;
        const prog = i / Math.max(1, target.length - 1);
        const shape = 0.6 + 0.9 * Math.abs(prog - 0.5) * 2;
        const jitter = Math.floor((Math.random() - 0.5) * 35);
        await sleep(clamp(Math.floor(base * shape) + jitter, 65, 260));
      }
      await sleep(350);
      if (!alive) return;
      setPhase("complete");
    })();

    return () => { alive = false; };
  }, [phase, trimmed, text]);

  return (
    <div className="wrap">
      <header className="top">
        <div className="brand">
          <div className="sigil" aria-hidden="true"></div>
          <div>
            <h1>The Hive Mind</h1>
            <p className="sub">Neural Consensus Interface</p>
          </div>
        </div>
      </header>

      <div className="card">
        <div className="glow" aria-hidden="true"></div>

        {phase === "input" && (
          <>
            <div className="sectionTitle">Intake</div>

            <label className="label">Type any word, name, or phrase</label>
            <textarea
              className="input"
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Anything at all…"
              maxLength={180}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />

            <div className="row2">
              <div className="chip">
                <div className="chipK">Signal</div>
                <div className="chipV">Stable</div>
              </div>
              <div className="chip">
                <div className="chipK">Latency</div>
                <div className="chipV">&lt; 1s</div>
              </div>
              <div className="chip">
                <div className="chipK">Mode</div>
                <div className="chipV">Private</div>
              </div>
            </div>

            <button className="btn" onClick={submit}>
              Confirm &amp; Seal
            </button>

            <div className="fineprint">
              Do not explain your choice. Do not edit after confirmation.
            </div>
          </>
        )}

        {phase === "syncing" && (
          <>
            <div className="sectionTitle">Synchronizing</div>
            <div className="meter">
              <div className="bar"></div>
            </div>
            <div className="fineprint">Hold still… establishing consensus.</div>
          </>
        )}

        {phase === "sealed" && (
          <>
            <div className="sectionTitle">Sealed</div>
            <div className="locked">
              <div className="big">SEALED</div>
              <div className="small">Do not change your mind.</div>
            </div>
            <div className="fineprint">
              Maintain silence. Await instruction.
            </div>
          </>
        )}

        {phase === "revealing" && (
          <>
            <div className="sectionTitle">Feedback</div>
            <div className="revealPanel">
              <div className="revealLabel">Echo</div>
              <div className="revealText">{revealed || " "}</div>
              <div className="revealSub">Do not react.</div>
            </div>
          </>
        )}

        {phase === "complete" && (
          <>
            <div className="sectionTitle">Complete</div>
            <div className="revealPanel">
              <div className="revealLabel">Echo</div>
              <div className="revealText">{revealed}</div>
              <div className="revealSub">Confirmed.</div>
            </div>
          </>
        )}

        {status && <div className="status">{status}</div>}

        <div className="ghost" aria-hidden="true">{showId}</div>
      </div>
    </div>
  );
}
