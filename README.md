# RegLens AI

**AI-powered policy and regulatory intelligence for small and medium-sized organisations across North America.**

RegLens takes a business through one short survey, then uses that structured context to decide which
regulatory requirements matter, explain them in plain language, and turn them into checklists, deadlines and
monitored changes.

The workflow the product is built around:

```
onboarding survey → structured business context → policy retrieval and selection →
AI-generated personalised analysis → compliance checklist → tasks, deadlines and reminders →
dashboard and monitoring
```

---

## Quick start

```bash
npm install
npm run supabase:start          # local Supabase (Postgres + Auth) via Docker
cp .env.example .env.local      # then fill in the values — see below
npm run db:migrate              # create the schema
npm run db:seed                 # jurisdictions, policies, change feed, 5 demo businesses
npm run dev                     # http://localhost:3000
```

Sign in with the seeded demo account — the sign-in page has a one-click button:

```
demo@reglens.ai / reglens-demo-2025
```

`npm run supabase:start` prints `API URL`, `DB URL`, `anon key` and `service_role key`. Copy those into
`.env.local`; `.env.example` already contains the standard local Supabase values as a reference.

---

## What you can do in the app

| Area | What works |
|---|---|
| **Authentication** | Sign up, sign in, sign out, protected routes, one-click demo account |
| **Onboarding** | Six-step survey: company, industry, activities, expansion, priorities, current workflow |
| **Dashboard** | Policy Risk Score with contributing factors, deadlines, detected changes, recommended actions, quick actions |
| **Policy search** | Keyword, country, jurisdiction, industry, topic, status, effective date and relevance filters; four sort orders |
| **Policy detail** | Plain-language summary, who is affected, requirements, consequences, deadlines, versions, change history, related policies, sources |
| **AI Policy Analyst** | Conversational workspace grounded in the business profile + retrieved policy records, structured into explanation, why it matters, impacts, risks, actions, deadlines, jurisdictions, sources |
| **Action planner** | Plans and tasks with checklists, priority, status, due dates, notes; filter, sort, group by plan |
| **Reminders** | Deadline, renewal, filing, review and custom reminders with advance notice, snooze and dismiss |
| **Notifications** | In-app only, with read/unread state |
| **Monitoring** | Follow policies, jurisdictions, industries or topics; change feed with review, dismiss, create-task and ask-AI actions |
| **Comparison** | Two or more jurisdictions side by side for one topic, including the federal rules above each state or province; save, print, turn into a plan |
| **Reports** | Point-in-time compliance summary, saved and printable to PDF |
| **Business profile** | Review and edit every onboarding answer; changes immediately re-rank relevance and refresh AI context |
| **Pricing** | Free / Pro $29 / Business $99, with persisted plan selection (no billing) |

Every demo business produces different content — different top-ranked policies, risk factors, tasks, deadlines
and AI context:

- **Frostonic** — cross-border e-commerce importing ice bath tubs (US, expanding into Canada)
- **Ricos Boutique** — ski and snowboard apparel importer (textile labelling, flammability testing)
- **Kumon Learning Center — Westside** — tutoring centre (licensing, staff screening, renewals)
- **Sparc Technologies** — kitchen robotics supplier (food sanitation + machinery safety + certification)
- **LotusFlare Canada Inc** — telecom operator with an internal compliance team (CRTC, PIPEDA, Law 25, CPRA)

---

## Architecture

```
src/
  app/
    page.tsx                  landing (public)
    legal/                    full disclaimer (public)
    pricing/                  public when signed out, in-app shell when signed in
    (auth)/                   sign-in, sign-up
    onboarding/               multi-step survey (own layout, no sidebar)
    (app)/                    everything behind the app shell
      dashboard/  policies/[id]/  analyst/[conversationId]/  planner/
      reminders/  monitoring/  compare/  reports/[id]/  profile/
      notifications/  settings/
  components/
    ui/                       button, card, badge, field, status badges, layout primitives
    app/                      product components (shell, switcher, wizard, planner, analyst, …)
  data/
    jurisdictions.ts          107 North American jurisdictions (federal → municipal)
    policies.ts               43 sample policy records
    updates.ts                versions + change-feed entries
    demo-businesses.ts        5 demo profiles with tasks, reminders, monitoring
  lib/
    ai/                       provider abstraction, prompt, retrieval, schema, demo analyst
    actions/                  server actions (auth, business, policies, tasks, reminders, ai, comparison, reports)
    supabase/                 browser / server / proxy clients
    relevance.ts              explainable policy↔business scoring
    risk.ts                   Policy Risk Score + profile completion
    comparison.ts             cross-jurisdiction comparison engine
    reports.ts                compliance report builder
    queries.ts                shared business-scoped data loaders
  proxy.ts                    session refresh + route protection (Next.js 16 proxy convention)
prisma/
  schema.prisma               full data model
  seed.ts                     idempotent seed
scripts/
  test-flows.ts               end-to-end journey tests
```

### Technology

- **Next.js 16** (App Router, Server Components, Server Actions, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS v4** with a token-based design system; hand-rolled shadcn-style primitives
- **Supabase** — Postgres for data, Supabase Auth for identity
- **Prisma 7** with the `@prisma/adapter-pg` driver adapter
- **Zod** for input and AI-output validation
- **Groq** for the AI Policy Analyst, with a deterministic fallback

### Key decisions

- **Server Actions over API routes.** Mutations sit next to the domain, are typed end to end, and revalidate
  the pages they affect. The one shared client hook, `useAction`, tracks the action's own pending state rather
  than the router refresh, so controls re-enable as soon as the write lands.
- **Explainable scoring, not a black box.** `relevance.ts` and `risk.ts` attach a human-readable reason to
  every point they add, and the UI shows them. Users can argue with the number.
- **Retrieval is local and simple.** The Analyst ranks the seeded corpus with the same relevance model the UI
  uses, always includes the policy in focus, and caps the context.
- **The AI can only cite what it was given.** After schema validation, citations are filtered to the policy
  records actually supplied, so the model cannot invent a reference.
- **Sample data is labelled everywhere.** Policy records summarise real frameworks in plain language and link
  to the responsible agency, but they are marked as sample data and never presented as live law.

---

## Environment variables

Copy `.env.example` to `.env.local`. Every value is documented inline there.

| Variable | Required | Where it comes from |
|---|---|---|
| `DATABASE_URL` | yes | Supabase → Settings → Database → **Transaction pooler** URI (port 6543, add `?pgbouncer=true`) |
| `DIRECT_URL` | yes | Supabase → Settings → Database → **Direct connection** URI (port 5432). Used by Prisma Migrate |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes\* | Supabase → Settings → API Keys → publishable key (`sb_publishable_…`) |
| `SUPABASE_SECRET_KEY` | seed only\* | Supabase → Settings → API Keys → secret key (`sb_secret_…`). **Server only** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | legacy\* | Older projects: the `anon` JWT. Used only if the publishable key is unset |
| `SUPABASE_SERVICE_ROLE_KEY` | legacy\* | Older projects: the `service_role` JWT. Used only if the secret key is unset |
| `GROQ_API_KEY` | optional | https://console.groq.com/keys |
| `GROQ_MODEL` | optional | Defaults to `llama-3.3-70b-versatile` |
| `NEXT_PUBLIC_DEMO_EMAIL` | optional | Demo account email, default `demo@reglens.ai` |
| `DEMO_PASSWORD` | optional | Demo account password, default `reglens-demo-2025` |

\* Supabase is migrating from the legacy JWT keys (`anon` / `service_role`) to the newer
`sb_publishable_…` / `sb_secret_…` pair. RegLens accepts **either** — set whichever pair your project shows
and leave the other blank. When both are present the newer format wins.

### AI provider — Groq

RegLens uses **Groq** for the AI Policy Analyst. Paste your key into `.env.local`:

```bash
GROQ_API_KEY="gsk_..."
# optional
GROQ_MODEL="llama-3.3-70b-versatile"
```

**Then restart the server.** Environment variables are read at startup, so a server that was already running
when you added the key will keep reporting demo mode. After the restart the Analyst header switches from
*"Demo analyst — no API key configured"* to *"Groq · <model>"*, and Settings → AI provider confirms it.

**Demo behaviour without a key.** With no `GROQ_API_KEY` the product does not break and shows no error. It
composes the same structured answer deterministically from your business profile and the retrieved policy
records — explanation, why it matters, impacts, risks, recommended actions, deadlines, jurisdictions and
sources — and labels it **"Demo analysis"** in the UI. Every downstream action (create a task, build an action
plan, save the answer) still works. The same fallback catches a failed Groq request, and says so on the card.

Model output is validated against a Zod schema before anything renders, and citations are filtered to the
records RegLens supplied.

**How much structure an answer gets is the model's call.** Say hello and you get a sentence back; ask a narrow
question and you get a direct answer; ask what you need to do before entering a new market and you get the
full breakdown — impacts, risks, recommended actions, deadlines, jurisdictions and sources. Every structured
field is optional, and the card renders only the sections that have content. A guard catches the opposite
failure: if a genuine regulatory question comes back with no substance behind it, RegLens composes the
analysis locally rather than passing on a brush-off.

**Small talk costs almost nothing.** A message that carries no regulatory question skips retrieval entirely and
goes to the model with a short prompt (~250 tokens instead of ~3,300), so a greeting is answered in about a
second and barely touches your token budget.

**Free-tier limits.** A full analysis costs roughly 3,300 prompt tokens and takes about 6 seconds. Groq's free
tier allows 100,000 tokens per day per model, so expect around 30 analyst questions a day before requests
return 429 and fall back to the local analyst — which the answer card tells you about rather than hiding.
Each model has its own daily budget, so switching `GROQ_MODEL` gives you a fresh one. `GROQ_TIMEOUT_MS`
(default 35000) bounds a full analysis; conversational replies use a fixed 8 seconds.

---

## Database

```bash
npm run supabase:start   # local Postgres + Auth (Docker)
npm run db:migrate       # create/apply migrations in development
npm run db:deploy        # apply existing migrations (CI / production)
npm run db:seed          # seed reference data + demo businesses
npm run db:reset         # drop, re-migrate and re-seed
npm run db:studio        # Prisma Studio
npm run supabase:stop
```

Prisma 7 keeps connection URLs in `prisma.config.ts` rather than `schema.prisma`; migrations use `DIRECT_URL`
when present, and the runtime client connects through the pg driver adapter in `src/lib/prisma.ts`.

The seed is idempotent — reference data is upserted and each demo business is rebuilt from scratch. It also
creates the demo user in Supabase Auth when `SUPABASE_SERVICE_ROLE_KEY` is set, and degrades gracefully with a
warning when it is not.

---

## Deploying to Vercel + hosted Supabase

1. **Create the Supabase project** at https://supabase.com/dashboard, then collect from
   Settings → Database and Settings → API: `DATABASE_URL` (pooler, 6543), `DIRECT_URL` (direct, 5432),
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

2. **Import the repo into Vercel.** Framework preset: Next.js. Set the **Build Command** to:

   ```
   npm run build:vercel
   ```

   That runs `prisma generate && prisma migrate deploy && next build`, so the hosted database picks up the
   schema on every deploy.

3. **Add the environment variables** in Vercel → Project → Settings → Environment Variables: the five Supabase
   values plus `GROQ_API_KEY` (and optionally `GROQ_MODEL`). Apply them to Production, Preview and Development.

4. **Set the Supabase Site URL** — Supabase → Authentication → URL Configuration — to your Vercel domain, so
   email confirmation links come back to the right place.

5. **Seed once** against the hosted database, from your machine with the production values in `.env.local`:

   ```bash
   npm run db:seed
   ```

Everything else is standard Next.js: no custom server, no edge runtime, no external services beyond Supabase
and Groq.

---

## Testing

```bash
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run build        # production build
npm run test:flows   # end-to-end journey tests against the real database
npm run test:ui      # browser tests against a running server
npm run verify       # typecheck + lint + build + test:flows
```

`test:flows` walks the full primary journey without mocks: Supabase sign-in → demo business selection →
onboarding writes structured context → policy search and relevance ranking → retrieval → analyst answer
(schema-validated) → action plan and tasks → checklist completion → reminders and notifications → monitoring
and change review → cross-jurisdiction comparison → report generation → plan selection → cleanup. It also
asserts that the five demo businesses produce genuinely different top policies and risk scores.

With a server running, it additionally checks HTTP routing, route protection and authenticated page rendering:

```bash
npm run build && npm run start          # terminal 1
BASE_URL=http://127.0.0.1:3000 npm run test:flows
```

`test:ui` drives a real Chromium through the product — demo sign-in, switching between demo businesses,
search and filters, policy actions, the planner and its checklists, reminders, monitoring, comparison, the AI
Analyst (including turning a recommendation into a task and an answer into a plan), report generation, plan
selection, onboarding a new business, deleting it, and signing out.

It uses `playwright-core`, which downloads no browsers. Point `PLAYWRIGHT_CHROMIUM` at a Chromium or Chrome
binary, or let it auto-detect a common install; with none available it prints a message and exits cleanly.

```bash
npm run build && npm run start          # terminal 1
npm run test:ui                         # terminal 2
```

Re-run `npm run db:seed` afterwards to reset the demo businesses, since both suites write real data.

---

## Legal positioning

> RegLens provides regulatory information and organizational tools. It does not constitute legal, tax,
> accounting, or professional advice. Regulations may change, and users should verify important requirements
> with the responsible authority or a qualified professional.

Shown during onboarding acknowledgement, on policy detail pages, in every AI Analyst answer, in reports, in
the app footer and sidebar, and in full at `/legal`.

---

## Known MVP limitations

Deliberate scope boundaries, not defects:

- **The regulatory dataset is a curated sample.** 43 records summarising real North American frameworks in
  plain language, chosen to exercise every workflow across US/Canada/Mexico at federal, state, provincial and
  local level. It is not a complete database, and it is labelled as sample data throughout.
- **Monitoring is simulated.** The change feed runs against seeded, versioned records. The full data flow —
  detection, relevance, review, action — works end to end, but there is no live crawler or agency feed.
- **Notifications are in-app only.** No email, SMS or push delivery is implemented, and the UI says so.
- **No billing.** Plan selection persists on the user record; no payment processor is integrated.
- **One user per account.** The data model supports several businesses per user and is shaped for teams, but
  there are no invitations, roles or permissions.
- **Report export is browser print.** The report page ships a PDF-friendly print stylesheet rather than a
  server-side PDF renderer.
- **AI usage is not rate-limited.** Plan limits are displayed but not enforced.
- **Search is Postgres `ILIKE` matching**, not full-text or vector search. Adequate for a dataset this size.
