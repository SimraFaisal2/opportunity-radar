// scripts/import-legacy-jobs.ts
//
// One-time migration: pulls every row out of the old Python app's
// applitrack.db (table `job_listings`) and upserts it into the new
// Prisma-managed Opportunity table, so the historical listings survive
// the port instead of the new app starting from zero.
//
// Usage:
//   npx tsx scripts/import-legacy-jobs.ts /path/to/applitrack.db
//
// (Uses Node's built-in sqlite module — no extra dependency to install.)
//
// Safe to re-run: matches existing rows by `guid` (source_guid from the old
// db, prefixed) and skips them instead of duplicating.

// Uses Node's built-in sqlite module (stable in Node >= 22.5) so the script
// has zero native dependencies — no node-gyp / Visual Studio toolchain needed.
import { DatabaseSync } from "node:sqlite";
import { prisma } from "../lib/prisma";

// SQLite has no enum type, so degrees and kinds are plain strings with these allowed values.
type Degree = "BACHELOR" | "MASTER" | "PHD" | "ANY";
type OppType = "INTERNSHIP" | "RESEARCH_INTERNSHIP" | "SCHOLARSHIP" | "OTHER";

interface LegacyJob {
  id: number;
  title: string;
  company: string;
  application_deadline: string | null; // column alias from models.py
  is_crowdsourced: number | null;
  created_at: string | null;
  source_guid: string | null;
}

function detectDegree(title: string): Degree {
  const t = title.toLowerCase();
  if (/\bphd\b|doctoral/.test(t)) return "PHD";
  if (/\bmaster'?s?\b|\bmsc\b/.test(t)) return "MASTER";
  if (/\bbachelor'?s?\b|\bbsc\b|intern/.test(t)) return "BACHELOR"; // internships skew undergrad; adjust as needed
  return "ANY";
}

function detectType(title: string, company: string = ""): OppType {
  const t = `${title} ${company}`.toLowerCase();
  if (/\bscholarship|fellowship|grant\b/.test(t)) return "SCHOLARSHIP";
  if (/\bresearch\b|\breu\b|\bscientific\b|max planck|\bmpia\b|research intern|research assistant|summer research/.test(t)) return "RESEARCH_INTERNSHIP";
  if (/\binternship|\bintern\b|traineeship|apprenticeship/.test(t)) return "INTERNSHIP";
  return "OTHER";
}

async function main() {
  const dbPath = process.argv[2];
  if (!dbPath) {
    console.error("Usage: npx tsx scripts/import-legacy-jobs.ts /path/to/applitrack.db");
    process.exit(1);
  }

  const legacyDb = new DatabaseSync(dbPath, { readOnly: true });
  const rows = legacyDb
    .prepare(
      `SELECT id, title, company, application_deadline, is_crowdsourced, created_at, source_guid
       FROM job_listings`
    )
    .all() as unknown as LegacyJob[];

  console.log(`Read ${rows.length} rows from legacy job_listings.`);

  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    // Every legacy row already has a source_guid after the earlier dedup
    // migration; fall back to a synthetic one for any that don't.
    const guid = row.source_guid || `legacy:${row.company}-${row.title}-${row.id}`.toLowerCase();

    const existing = await prisma.opportunity.findUnique({ where: { guid } });
    if (existing) {
      skipped++;
      continue;
    }

    await prisma.opportunity.create({
      data: {
        company: row.company,
        title: row.title,
        description: null,
        deadline: row.application_deadline ? new Date(row.application_deadline) : null,
        degree: detectDegree(row.title),
        type: detectType(row.title, row.company),
        countries: "Global", // legacy schema never tracked eligible countries — defaulting; edit per-row if known
        applyUrl: "", // legacy schema never stored an apply link — fill in manually or leave blank until re-synced
        sourceFeed: row.is_crowdsourced ? "Legacy import (crowdsourced)" : "Legacy import",
        guid,
        publishedAt: row.created_at ? new Date(row.created_at) : null,
      },
    });
    created++;
  }

  legacyDb.close();
  await prisma.$disconnect();

  console.log(`Import complete — created ${created}, skipped ${skipped} (already present).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
