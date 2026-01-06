export default async (req) => {
  try {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
    const body = await req.json().catch(() => ({}));
    const id = (body.id || "").trim();
    const show = (body.show || "").trim();
    if (!id || !show) return new Response("Missing id/show", { status: 400 });

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY) return new Response("Server not configured", { status: 500 });

    const q = new URL(`${SUPABASE_URL}/rest/v1/entries`);
    q.searchParams.set("id", `eq.${id}`);
    q.searchParams.set("show_id", `eq.${show}`);

    const r = await fetch(q.toString(), {
      method: "PATCH",
      headers: {
        apikey: SERVICE_KEY,
        authorization: `Bearer ${SERVICE_KEY}`,
        "content-type": "application/json",
        prefer: "return=representation",
      },
      body: JSON.stringify({ reveal_ready: true }),
    });

    if (!r.ok) return new Response("Update failed", { status: 500 });
    const rows = await r.json();
    return new Response(JSON.stringify(rows[0] || { ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response("Server error", { status: 500 });
  }
};
