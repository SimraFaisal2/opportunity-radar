# Opportunity Radar — Internship & Scholarship Tracker

A full-stack **opportunity radar** that aggregates, filters, and ranks ~500 internships, research programs, summer schools, and scholarships — then helps you apply, track, and measure. Built with Next.js (App Router), Prisma + SQLite, and a dark, design-system-driven UI.

> **The problem I was solving:** finding summer research opportunities means manually checking 30+ program pages for deadlines, eligibility, and funding. This app brings that whole workflow — discover → match → apply → track → analyze — into one place, with data kept honest (no invented deadlines).

---

## Features

| Feature | What it does |
| --- | --- |
| **📡 Opportunity Radar** (`/board`) | 500+ live listings across 30 countries. Filter by type (Internships / Research / Summer Schools / Scholarships), degree (Bachelor / Master / PhD), field, and country. Search, list/grid views, group-by-country, deadline countdowns, and freshness badges. |
| **🧠 CV Matcher** (`/cv-match`) | Upload your CV (PDF) and get a ranked shortlist of the whole board. Two engines: **Gemini AI** (paste a free key in the UI — stored in `localStorage`, never in env) or a **local heuristic** (skill-overlap scoring) that works with zero keys. Also matches your CV against any pasted job description. |
| **🗂️ Kanban Pipeline** (`/pipeline`) | Drag-and-drop application tracker (Saved → Applied → Interview → Offer → Rejected) with salary, notes, and search. |
| **📊 Analytics** (`/analytics`) | Pipeline metrics and charts (Recharts). |
| **📅 Deadline Calendar** (`/calendar`) | Calendar view of every deadline, highlighting what's due soonest. |
| **🌍 Countries** (`/countries`) | Flag-card grid with per-country counts, deep-linking to filtered boards. |
| **🔐 Accounts** | Register/login with scrypt-hashed passwords and HMAC-signed session cookies (no third-party auth dependencies). |

## Tech stack

- **Next.js 14 (App Router)** — React Server Components + API routes
- **TypeScript** — strict, zero `any` in app code
- **Prisma + SQLite** — unified schema: `Opportunity`, `Application`, `CvMatchResult`, `User`
- **Tailwind CSS** — custom design tokens, dark "mission-control" theme with template accent presets
- **@hello-pangea/dnd** — drag-and-drop pipeline
- **Recharts** — analytics
- **Gemini API** (optional) + local heuristic matcher for CV scoring

## Architecture

```
┌─────────────── Sources ───────────────┐
│  RSS feeds (4)    Curated seeds       │
│  GitHub internship list (SimplifyJobs)│
└──────────────────┬───────────────────┘
                   ▼
        ┌──────────────────────┐
        │  lib/rss-sync.ts +   │   ← keyword detectors: type, degree,
        │  scripts/*.ts seeds  │     country, deadline (regex, no AI)
        └──────────┬───────────┘
                   ▼
        ┌──────────────────────┐
        │  SQLite (Prisma)     │   ← single source of truth
        └──────────┬───────────┘
                   ▼
   ┌─────────── API routes ───────────┐
   │ /api/opportunities /countries    │
   │ /api/applications /analytics     │
   │ /api/cv-match (+ /suggest)       │
   └────────────────┬─────────────────┘
                    ▼
        Client pages (board, pipeline, …)
```

**Design decisions worth knowing:**

- **Honest data over invented data.** Deadlines that can't be verified are `null` and display as "rolling" — never fabricated dates. Eligibility is hand-researched from official program pages.
- **Dual-mode CV matcher.** The Gemini path gives deep "why it fits" analysis; the local heuristic (skill coverage + token overlap) guarantees the feature works offline and free, with a clear "⚡ Local estimate" badge so users know which mode ran.
- **Canonical country model.** `lib/countries.ts` is the single source of truth for names + flags; every writer (RSS sync, GitHub importer, seeds) emits canonical names so filters, flags, and the countries page never drift.
- **Idempotent seeds.** All seed scripts upsert by stable `guid` prefixes (`curated:`, `curated-scholarship:`, `github:`) — re-running refreshes instead of duplicating.

## Getting started

```bash
npm install          # runs prisma generate on postinstall
cp .env.example .env # DATABASE_URL="file:./dev.db" + a random AUTH_SECRET
npm run db:push      # create tables
npm run dev          # http://localhost:3000/board
```

**Populate data** (all idempotent — safe to re-run):

```bash
npx tsx scripts/seed-research-programs.ts   # curated research programs (EPFL, CERN, Mitacs…)
npx tsx scripts/seed-scholarships.ts        # curated scholarships (Bachelor/Master/PhD)
npx tsx scripts/import-github-internships.ts# ~460 tech internships (fetches SimplifyJobs)
```

Then hit **Sync** on `/board` to pull the latest RSS feed items.

**CV Matcher:** no key needed — it falls back to the local heuristic. For AI analysis, grab a free key at https://aistudio.google.com/apikey and paste it on `/cv-match` (stored in your browser only).

**Deploying?** See **[DEPLOYMENT.md](./DEPLOYMENT.md)** — production runs on Neon Postgres (SQLite can't run on Vercel), with a dedicated `schema.postgres.prisma`, `db:push:prod`/`db:seed:prod` scripts, and the two env vars (`DATABASE_URL`, `AUTH_SECRET`) to set in Vercel.

## Project structure

```
app/
  board/        # Opportunity radar (main page)
  pipeline/     # Kanban application tracker
  cv-match/     # CV matcher (Gemini + local heuristic)
  analytics/    # Pipeline charts
  calendar/     # Deadline calendar
  countries/    # Country flag-card grid
  api/          # All API routes
lib/            # rss-sync, cv-heuristic, countries, fields, auth, prisma
scripts/        # Idempotent data seeds + importers
components/     # NavBar, Logo, CountryFlag
```

---

*Built as a personal tool to stop manually refreshing 30 program pages — every deadline on the board points at an official source, and unknowns say "rolling" instead of pretending.*
