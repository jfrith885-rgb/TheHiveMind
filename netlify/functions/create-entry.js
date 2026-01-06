export default async (req) => {
  try {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return new Response(JSON.stringify({ error: "Server not configured (missing SUPABASE_URL or SERVICE_ROLE key)" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const show_id = (body.show_id || "").trim();
    const entry_text = (body.entry_text || "").trim();
    const client_token = (body.client_token || "").trim();

    if (!show_id || !entry_text || !client_token) {
      return new Response(JSON.stringify({ error: "Missing show_id / entry_text / client_token" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const endpoint = `${SUPABASE_URL}/rest/v1/entries?select=id`;
    const r = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        authorization: `Bearer ${SERVICE_KEY}`,
        "content-type": "application/json",
        prefer: "return=representation",
      },
      body: JSON.stringify({ show_id, entry_text, client_token }),
    });

    const txt = await r.text();
    if (!r.ok) {
      return new Response(JSON.stringify({ error: txt || "Insert failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    let rows = null;
    try { rows = txt ? JSON.parse(txt) : null; } catch {}
    const id = Array.isArray(rows) ? rows[0]?.id : rows?.id;

    return new Response(JSON.stringify({ id }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
