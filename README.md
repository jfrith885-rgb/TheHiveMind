# The Hive Mind — Show ID filter + auto-sync + spectator echo + PWA

## Fix for “Transmission failed”
Spectator submissions now go through a Netlify Function:
`/.netlify/functions/create-entry`

So the spectator page no longer depends on anon INSERT permissions or VITE_* vars.

## Supabase table
Run this in Supabase SQL Editor:

```sql
create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  show_id text not null,
  entry_text text not null,
  client_token text not null,
  reveal_ready boolean default false,
  created_at timestamp with time zone default now()
);
```

## Netlify env vars (required)
Functions:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

Optional:
- VITE_PERFORMER_PIN

## Deploy note
Use a deploy method that runs the build + includes functions (Git deploy or Netlify CLI).
