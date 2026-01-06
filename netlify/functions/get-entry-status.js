export default async (req) => {
  try {
    const url = new URL(req.url);
    const id = (url.searchParams.get("id") || "").trim();
    const t = (url.searchParams.get("t") || "").trim();
    if (!id || !t) return new Response("Missing params", { status: 400 });

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY) return new Response("Server not configured", { status: 500 });

    const q = new URL(`${SUPABASE_URL}/rest/v1/entries`);
    q.searchParams.set("select", "reveal_ready,created_at");
    q.searchParams.set("id", `eq.${id}`);
    q.searchParams.set("client_token", `eq.${t}`);
    q.searchParams.set("limit", "1");

    const r = await fetch(q.toString(), {
      headers: { apikey: SERVICE_KEY, authorization: `Bearer ${SERVICE_KEY}` },
    });
    if (!r.ok) return new Response("Query failed", { status: 500 });

    const rows = await r.json();
    return new Response(JSON.stringify(rows[0] || null), {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response("Server error", { status: 500 });
  }
};
