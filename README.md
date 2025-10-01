## DA Statement (Next.js + Supabase + Drizzle)

MVP scaffold for generating Design & Access Statements (England-only).

### Setup

1) Create a Supabase project.
- Copy `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from Project Settings → API.

2) Environment
- Duplicate `.env.example` to `.env.local` and fill values.

3) Install deps and run
```bash
pnpm install
pnpm db:push
pnpm dev
```

### Drizzle migrations
- Configure in `drizzle.config.ts` (out: `./db/migrations`).
- Apply schema: `pnpm db:push`.
- Explore: `pnpm db:studio`.

### Auth
- Email magic-link with Supabase Auth.
- Required env: `NEXT_PUBLIC_APP_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
- In Supabase Dashboard: enable Email auth; set Site URL and Redirect URL to `${NEXT_PUBLIC_APP_URL}` and `${NEXT_PUBLIC_APP_URL}/auth/callback`.
- Test:
```bash
pnpm db:push
pnpm dev
# Visit /auth/sign-in, enter email, click link from inbox.
```

### Tenant model
- All business tables include `tenant_id` (nullable for now).
- For MVP, everything defaults to `TENANT_DEFAULT`.

### Data flow (/api/das)
- Input: `{ address }`.
- Pipeline (stubbed): OS Places → UPRN → designations (planning + historic) → PlanIt → LLM → persist.

### Guardrails
- Service role keys are server-only; never exposed to the browser.
- Third-party fetchers live server-side; browser interacts via route handlers.
- England-only scope.

### Testing
- Vitest for utilities; minimal setup.

