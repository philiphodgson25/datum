# DA Statement – Engineering Handover

Last updated: 6 October 2025  
Maintainer: phil@latentmade.com

---

## 1. Quick Start

```bash
pnpm install
cp .env.example .env.local   # fill in Supabase + app values
pnpm db:push                 # sync schema to Supabase
pnpm dev                     # starts Next.js on http://localhost:3030
```

- Sign in at `/auth/sign-in` (Supabase magic link).
- Primary workflow lives at `/new`. You can prefill the address: `/new?address=10 Downing Street`.
- `/runs` shows recent statement runs when the database is connected.

---

## 2. Environment & Secrets

All environment variables are validated at boot via `lib/env.ts` (server) and `lib/env.public.ts` (client).  
`scripts/utils/loadEnv.ts` makes CLI scripts share the same loading behaviour (`.env.local` → `.env`).

| Scope      | Variables                                                                                   |
|------------|----------------------------------------------------------------------------------------------|
| Public     | `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`           |
| Server     | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, optional `OPENAI_API_KEY`, `NOMINATIM_USER_AGENT` |

- Rotate Supabase anon + service-role keys if they were ever checked into git (the repo is now clean).
- `.env.local` is ignored by git; keep secrets there or in your shell session.
- When changing dev ports, update both `PORT` and `NEXT_PUBLIC_APP_URL`.

---

## 3. Data & Ingestion

| Script                                    | What it does                                      | Notes |
|-------------------------------------------|---------------------------------------------------|-------|
| `scripts/import-lpa-data.ts`              | Imports LPA CSV + GeoJSON into Supabase           | Looks for source data under `~/Library/CloudStorage/.../Datum/Data/local-planning-authority`. |
| `scripts/import-conservation-areas.ts`    | Upserts conservation areas via RPC                | Set `CA_FILE=/path/to/geojson` if file differs from default. |
| `pnpm db:push` / `pnpm db:studio`         | Applies schema / opens Drizzle Studio             | Relies on validated `DATABASE_URL`. |

All scripts automatically load env vars and surface validation errors early; they require the Supabase service-role key.

Upcoming Task 4 introduces a dataset registry to make adding new collections faster—plan to place new scripts under `scripts/` and share helpers there.

---

## 4. Application Overview

- **Stack**: Next.js 14 App Router, React 18, TypeScript 5, Supabase (Auth + Postgres/PostGIS), Drizzle ORM.
- **Auth**: Supabase email magic links. Guarded routes handled by `middleware.ts`.
- **Core flow**: user provides address → `/api/lpa/lookup` geocodes (Nominatim) → Supabase RPC `get_lpa_by_point` → results displayed in accordion + Leaflet map.
- **UI**: Map components under `app/components/map/`. Toggle behaviour and extra layers scheduled for Task 4/5.
- **Testing**: Vitest configured; `tests/lpa-lookup.test.ts` covers the LPA lookup service. Extend for new integrations.

---

## 5. Operational Notes

- **Geocoding**: We currently hit Nominatim with a custom `User-Agent`; production should swap to OS Places when keys are available.
- **Map**: Constrained to England bounds. `MapPanel` renders the LPA boundary; additional layers are pending registry work.
- **Supabase RPCs**: `get_lpa_by_point`, `get_lpa_stats`, and `upsert_conservation_areas`. Keep SQL functions documented in Supabase for easy auditing.
- **Logging**: Minimal today; Task 6 adds structured logging + metrics.

---

## 6. Troubleshooting

- **Auth loop**: Ensure Supabase Site URL & Redirect URL match `NEXT_PUBLIC_APP_URL` and `${APP_URL}/auth/callback`.
- **Port conflicts**: Use `PORT=<new> pnpm dev`. Update `NEXT_PUBLIC_APP_URL` to match.
- **DB connection errors**: Re-run `pnpm db:push` after confirming `DATABASE_URL` in `.env.local`. Secrets must include `sslmode=require`.
- **Geocode 404 / 429**: Input might be too vague or geocoder throttled. See Task 6 for planned caching/backoff.

---

## 7. Secret Hygiene Checklist

- [x] `.env.local` removed from repo history (rotate keys if you cloned earlier).
- [x] Service-role keys never appear in client bundles.
- [x] `.gitignore` protects `*.env.local` and logs.
- Action after onboarding: rotate Supabase keys via dashboard and update `.env.local`.

---

## 8. Next Deliverables

1. **Task 4** – dataset registry & conservation area toggle (in progress).
2. **Task 5** – accordion restructuring, map legend, a11y fixes.
3. **Task 6** – structured logging, request metrics, geocoder caching/backoff.

Keep this document updated after each major task so new contributors can follow the latest process.

