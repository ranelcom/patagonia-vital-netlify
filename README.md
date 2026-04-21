# patagonia-vital-netlify

A minimal Netlify site that displays rows from Supabase tables through a Netlify Function.

## How it works

- `index.html` — static frontend with a table picker and a results grid.
- `netlify/functions/supabase.mts` — Netlify Function at `/api/supabase` that proxies read queries to Supabase's
  PostgREST endpoint. The anon key stays on the server.
- `netlify.toml` — wires `/api/*` → `/.netlify/functions/*`.

## Setup

1. Install dev dependencies (just Netlify Function types):
   ```
   npm install
   ```
2. Set your Supabase credentials as environment variables:
   ```
   netlify env:set SUPABASE_URL   https://YOUR-PROJECT.supabase.co
   netlify env:set SUPABASE_ANON_KEY YOUR-ANON-KEY
   ```
   Or add them in the Netlify UI under **Site configuration → Environment variables**.
3. Edit the `<option>` list in `index.html` to match the tables in your Supabase project (or use the
   "(custom…)" entry to type one in).
4. Make sure Row Level Security policies on those tables allow `SELECT` with the anon key (or adjust to use a
   service-role key server-side — see below).

## Run locally

```
netlify dev
```

Open <http://localhost:8888>, pick a table, click **Load**.

You can also hit the function directly:

```
curl 'http://localhost:8888/api/supabase?table=users&limit=5'
```

## Notes

- The function only supports `SELECT`. It validates `table` and `select` against simple regexes before inserting
  them into the upstream URL.
- To use the privileged service-role key instead of the anon key, swap `SUPABASE_ANON_KEY` for a
  `SUPABASE_SERVICE_ROLE_KEY` env var in `netlify/functions/supabase.mts`. Never expose that key in the browser.
