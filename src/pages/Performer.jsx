import { useEffect, useMemo, useState } from "react";

function genShowId() {
  return crypto?.randomUUID?.() ? crypto.randomUUID().slice(0, 10) : Math.random().toString(36).slice(2, 12);
}

export default function Performer() {
  const [showId, setShowId] = useState(() => localStorage.getItem("hivemind_active_show") || genShowId());
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [msg, setMsg] = useState("Listening…");
  const [armed, setArmed] = useState(false);

  const requiredPin = import.meta.env.VITE_PERFORMER_PIN || "";
  const showGate = useMemo(() => requiredPin.length > 0, [requiredPin]);
  const [authorized, setAuthorized] = useState(!showGate);
  const [pin, setPin] = useState("");

  useEffect(() => {
    localStorage.setItem("hivemind_active_show", showId);
  }, [showId]);

  const spectatorLink = useMemo(() => {
    const u = new URL(window.location.origin + "/");
    u.searchParams.set("h", showId);
    return u.toString();
  }, [showId]);

  async function fetchLatest() {
    const r = await fetch(`/.netlify/functions/get-latest-entry?show=${encodeURIComponent(showId)}`);
    if (!r.ok) throw new Error("Fetch failed");
    return r.json();
  }

  async function fetchHistory() {
    const r = await fetch(`/.netlify/functions/get-recent-entries?show=${encodeURIComponent(showId)}`);
    if (!r.ok) throw new Error("Fetch failed");
    return r.json();
  }

  async function armReveal(entryId) {
    const r = await fetch(`/.netlify/functions/arm-reveal`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: entryId, show: showId }),
    });
    if (!r.ok) throw new Error("Arm failed");
    return r.json();
  }

  useEffect(() => {
    if (!authorized) return;

    let alive = true;

    const tick = async () => {
      try {
        const data = await fetchLatest();
        if (!alive) return;

        if (data?.entry_text) {
          setLatest(data);
          setMsg("");
          setArmed(Boolean(data.reveal_ready));
        } else {
          setMsg("No entries yet.");
        }
      } catch {
        if (!alive) return;
        setMsg("Could not fetch.");
      }
    };

    const tickHistory = async () => {
      try {
        const list = await fetchHistory();
        if (!alive) return;
        setHistory(Array.isArray(list) ? list : []);
      } catch {}
    };

    tick();
    tickHistory();

    const id = setInterval(tick, 650);
    const id2 = setInterval(tickHistory, 2500);

    return () => {
      alive = false;
      clearInterval(id);
      clearInterval(id2);
    };
  }, [authorized, showId]);

  if (!authorized) {
    return (
      <div className="wrap">
        <header className="top">
          <div className="brand">
            <div className="sigil" aria-hidden="true"></div>
            <div>
              <h1>Operator Console</h1>
              <p className="sub">Restricted Access</p>
            </div>
          </div>
        </header>

        <div className="card">
          <div className="sectionTitle">Authenticate</div>
          <label className="label">Operator PIN</label>
          <input
            className="input"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••"
            type="password"
          />
          <button
            className="btn"
            onClick={() => {
              if (pin === requiredPin) setAuthorized(true);
            }}
          >
            Enter
          </button>
          <div className="fineprint">Set VITE_PERFORMER_PIN in Netlify env vars (optional).</div>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap">
      <header className="top">
        <div className="brand">
          <div className="sigil" aria-hidden="true"></div>
          <div>
            <h1>Operator Console</h1>
            <p className="sub">Show Filter Active</p>
          </div>
        </div>
        <a className="tinyLink" href="/">Return</a>
      </header>

      <div className="card">
        <div className="sectionTitle">Show ID</div>
        <div className="row3">
          <input
            className="input"
            value={showId}
            onChange={(e) => setShowId(e.target.value.trim())}
            placeholder="show id"
          />
          <button className="btn secondary" onClick={() => setShowId(genShowId())}>New</button>
        </div>

        <div className="fineprint">
          Open this on the spectator’s phone:
          <div className="linkBox" onClick={() => navigator.clipboard?.writeText(spectatorLink).catch(()=>{})}>
            {spectatorLink}
          </div>
          <div className="muted tiny">Tap link to copy.</div>
        </div>

        <div className="spacer"></div>

        <div className="sectionTitle">Latest (Auto)</div>
        <div className="revealBox">
          <div className="revealText">{latest?.entry_text || msg || "—"}</div>
          {latest?.created_at && (
            <div className="muted tiny">{new Date(latest.created_at).toLocaleString()}</div>
          )}

          <div className="row3" style={{ marginTop: 12 }}>
            <button
              className={"btn " + (armed ? "ok" : "")}
              disabled={!latest?.id || armed}
              onClick={async () => {
                if (!latest?.id) return;
                try {
                  await armReveal(latest.id);
                  setArmed(true);
                } catch {}
              }}
            >
              {armed ? "Reveal Armed" : "Arm Spectator Reveal"}
            </button>
          </div>

          <div className="fineprint">
            “Arm Spectator Reveal” makes their screen echo the phrase letter-by-letter.
          </div>
        </div>

        <div className="spacer"></div>

        <div className="sectionTitle">Recent (Show)</div>
        <div className="list">
          {history.length === 0 ? (
            <div className="muted">No recent entries.</div>
          ) : (
            history.map((it) => (
              <div className="listItem" key={it.id}>
                <div className="liMain">{it.entry_text}</div>
                <div className="liMeta">{new Date(it.created_at).toLocaleTimeString()}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
