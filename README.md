## DA Statement (Next.js + Supabase + Drizzle)

MVP scaffold for generating Design & Access Statements (England-only).

### Setup

1. **Create Supabase project**
   - Copy `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from *Project Settings → API*.
   - Grab the pooled `DATABASE_URL` from *Project Settings → Database*.

2. **Environment variables**
   - `cp .env.example .env.local` and fill placeholders:
     - `NEXT_PUBLIC_APP_URL` must match the dev server port (defaults to `http://localhost:3030`).
     - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public values).
     - `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` (server only).
     - `DATABASE_URL` (pooled connection string with `sslmode=require`).
     - Optional: `NOMINATIM_USER_AGENT`, `OPENAI_API_KEY`.
   - ⚠️ Rotate Supabase anon + service-role keys if any were previously committed or shared.

3. **Install & bootstrap**
   ```bash
   pnpm install
   pnpm db:push          # sync schema via Drizzle
   pnpm dev              # starts Next.js on port 3030
   ```
   Use `PORT=3001 pnpm dev` to choose a different port and update `NEXT_PUBLIC_APP_URL` accordingly.

### Running locally
- Visit `/` and sign in via Supabase magic link (email auth must be enabled in the Supabase dashboard).
- `/new?address=...` auto-performs LPA lookup; results are displayed in the accordion + Leaflet map.
- `/runs` lists recent statement runs (requires database config).

### Database & ingestion
- Schema lives in `lib/schema.ts`; migrations are generated to `db/migrations`.
- Useful commands:
  ```bash
  pnpm db:push          # apply schema
  pnpm db:studio        # open Drizzle studio
  ```
- Data import scripts (require service-role key):
  - `pnpm exec tsx scripts/import-lpa-data.ts` – CSV + GeoJSON import for LPAs (see script for expected file paths).
  - `CA_FILE=/path/to/file.geojson pnpm exec tsx scripts/import-conservation-areas.ts` – upserts conservation areas via Supabase RPC.
- All scripts load `.env.local` automatically via `scripts/utils/loadEnv.ts`.

### Adding a new data collection
1. Model the table (or RPC) in `lib/schema.ts` and push via `pnpm db:push`.
2. Write/extend an ingestion script under `scripts/` that uses `lib/env` for credentials.
3. Expose data via `app/api/<collection>/route.ts` with Zod validation.
4. Register UI/map layers (see upcoming registry work in `lib/datasets` once Task 4 lands).
5. Document any new env vars or scripts in this README and `handover.md`.

### Troubleshooting
- **Auth loop**: ensure Supabase *Site URL* equals `NEXT_PUBLIC_APP_URL`; magic link redirect should be `${NEXT_PUBLIC_APP_URL}/auth/callback`.
- **Port conflicts**: override with `PORT=<number> pnpm dev` and update env variable.
- **Database errors**: confirm `DATABASE_URL` is populated; scripts throw explicit errors if env validation fails.
- **Nominatim 429 / aggressive rate limits**: configure `NOMINATIM_USER_AGENT`, consider swapping to OS Places (production plan).

### Guardrails
- Service-role keys stay server-side; never expose them in client bundles.
- Rotate Supabase keys after sharing `.env.local` or rotating pipeline access.
- Third-party fetchers run server-side; browser talks only to Next.js route handlers.
- Scope is England-only for now; adjust map bounds accordingly.

### Testing
- Vitest commands:
  ```bash
  pnpm test              # run all tests
  pnpm test --run        # run without watch
  ```
