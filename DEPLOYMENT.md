# Deploying to Vercel (production)

This app runs on **SQLite locally** and **PostgreSQL (Neon) in production** — Vercel's
serverless functions have a read-only filesystem, so SQLite can't work there.
The project ships two Prisma schemas for exactly this split:

| Where | Schema | Database |
| --- | --- | --- |
| Local dev | `prisma/schema.prisma` | SQLite (`file:./dev.db`) |
| Vercel (production) | `prisma/schema.postgres.prisma` | PostgreSQL (Neon) |

Everything else — env vars, routes, seeds — is shared. The Gemini API key
stays client-side (`localStorage` on `/cv-match`), so **no Gemini key is needed
in Vercel**.

## 1. Create a free Postgres database (Neon)

1. Sign up at https://neon.tech (free tier — plenty for this app).
2. Create a project → copy the connection string. Prefer the **pooled**
   connection string (`?sslmode=require` with `-pooler` in the host) for
   serverless, but the direct one also works.
3. It should look like:
   `postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`

## 2. Create the tables + seed the production database

Run these **from your machine** (they target whatever `DATABASE_URL` points at):

```bash
# from opportunities-tracker/
export DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Create tables on Neon
npm run db:push:prod

# Load the curated data (all idempotent — safe to re-run)
npm run db:seed:prod
```

`db:seed:prod` runs the research-programs seed, the scholarships seed, and the
GitHub tech-internship importer (fetches the SimplifyJobs list over the
network). Skip the importer if you don't want ~460 tech rows.

## 3. Deploy to Vercel

1. Push this repo to GitHub (see `README.md`).
2. Go to https://vercel.com/new → **Import** the repo.
3. Framework preset: **Next.js** (auto-detected). Build command stays
   `npm run build` — the repo's `vercel-build` script (which generates the
   Prisma client against the Postgres schema first) is picked up automatically.
4. **Environment Variables** — add these two:

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | your Neon connection string |
   | `AUTH_SECRET` | a random 64-char hex string — `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

   > The app **refuses to boot in production without `AUTH_SECRET`** — this is
   > deliberate (see `lib/auth.ts`) so a missing secret can't ship silently.
5. **Deploy.** First build takes ~1–2 min (Prisma generate + Next build).

## 4. Post-deploy

- **Verify:** open `/board`, `/countries`, `/pipeline`. The board should show
  the seeded listings from Neon.
- **RSS Sync button:** allowed up to 60s (`maxDuration` on the route), but on
  Vercel's free plan a single sync can still hit plan limits. If Sync reports
  a timeout, just press it again — each feed is upserted independently and
  retries are safe.
- **CV Matcher:** works with no key (local heuristic). Paste a free Gemini key
  at https://aistudio.google.com/apikey on `/cv-match` for AI analysis.

## Production gotchas (all handled)

- **No SQLite on Vercel** → Postgres schema + `vercel-build` generates the
  client against it.
- **Build bundling** → `@prisma/client` is externalized in `next.config.js`.
- **Function timeouts** → RSS sync + both Gemini routes export
  `maxDuration = 60` (ignored by local dev).
- **Missing session secret** → hard failure in production instead of a
  known-default signing key.
- **`next/font/google`** → fetched at build time; Vercel build has network, so
  fonts bundle correctly.

## Troubleshooting

- `P1012: the URL must start with postgresql://` → `DATABASE_URL` isn't set
  to the Neon URL for the command you ran (a local `DATABASE_URL` in `.env`
  can shadow it). Set it inline: `DATABASE_URL="postgresql://…" npm run db:push:prod`.
- `P1001: Can't reach database server` → check the Neon host + that the DB
  isn't paused (Neon free tier pauses after idle; waking takes ~5s on the
  first request).
- Prisma client mismatch after schema edits → re-run `prisma generate` for
  the schema you changed; the deploy pipeline does this automatically.
