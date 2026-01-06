export default async (req) => {
  try {
    const url = new URL(req.url);
    const show = (url.searchParams.get("show") || "").trim();
    if (!show) return new Response("Missing show", { status: 400 });

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY) return new Response("Server not configured", { status: 500 });

    const q = new URL(`${SUPABASE_URL}/rest/v1/entries`);
    q.searchParams.set("select", "id,entry_text,created_at,reveal_ready");
    q.searchParams.set("show_id", `eq.${show}`);
    q.searchParams.set("order", "created_at.desc");
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
