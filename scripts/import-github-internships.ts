// scripts/import-github-internships.ts
//
// Imports live internship roles from the SimplifyJobs/Summer2027-Internships
// GitHub repo (Pitt CSC & Simplify — the canonical community-maintained tech
// internship aggregator, updated daily). Gives the board real, current-cycle
// roles from thousands of companies, not just the curated research list.
//
// Sources:
//   - README.md           — Summer 2027 internships (the current application
//                           cycle; this repo is created fresh each August).
//   - README-Off-Season.md— off-cycle roles (Fall/Spring/Winter terms). Only
//                           upcoming terms are imported, deduped by company+role,
//                           capped so the board stays usable.
//
// The tables have no deadline column ("Age" = days since posted), so imported
// rows keep a null deadline — better an honest "no fixed deadline" than a made
// up one. Location and the 🛂/🇺🇸/🎓 markers become countries + eligibility.
//
// Usage:
//   npx tsx scripts/import-github-internships.ts
//
// Idempotent: upserts by `guid` (prefixed "github:"), so re-running refreshes
// instead of duplicating.

import { prisma } from "../lib/prisma";
import { normalizeCountriesField } from "../lib/countries";

const MAIN_URL = "https://raw.githubusercontent.com/SimplifyJobs/Summer2027-Internships/dev/README.md";
const OFFSEASON_URL = "https://raw.githubusercontent.com/SimplifyJobs/Summer2027-Internships/dev/README-Off-Season.md";

// Keep the off-season slice small — the board already renders every row.
const MAX_OFFSEASON_ROLES = 300;

// Terms that are still upcoming from today (Aug 2026). Anything in the past
// (Summer/Spring 2026, Fall 2025…) is skipped.
const UPCOMING_TERMS = [
  "Fall 2026",
  "Winter 2027",
  "Spring 2027",
  "Fall 2027",
  "Winter 2028",
  "Spring 2028",
  "Winter 2029",
];

type Degree = "BACHELOR" | "MASTER" | "PHD" | "ANY";
type OppType = "INTERNSHIP" | "RESEARCH_INTERNSHIP" | "SCHOLARSHIP" | "OTHER";

const MARKERS: Record<string, string> = {
  closed: "\u{1F512}", // 🔒 application closed
  citizenship: "\u{1F1FA}\u{1F1F8}", // 🇺🇸 US citizenship required
  sponsorship: "\u{1F6C2}", // 🛂 no visa sponsorship
  advanced: "\u{1F393}", // 🎓 advanced degree required
  faang: "\u{1F525}", // 🔥 FAANG+ company
};

const US_STATES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS",
  "KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY",
  "NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV",
  "WI","WY","DC",
]);

// Ordered: check explicit country keywords first, then US state patterns.
// Country values are canonical names — matches lib/countries.ts.
const COUNTRY_RULES: { re: RegExp; country: string }[] = [
  { re: /\buk\b|london|england|scotland|wales|manchester/i, country: "United Kingdom" },
  { re: /canada|toronto|vancouver|montreal|ottawa|ontario|quebec/i, country: "Canada" },
  { re: /india|bangalore|hyderabad|mumbai|delhi|pune/i, country: "India" },
  { re: /germany|berlin|munich|frankfurt|hamburg|stuttgart/i, country: "Germany" },
  { re: /switzerland|zurich|geneva|lausanne/i, country: "Switzerland" },
  { re: /netherlands|amsterdam|rotterdam/i, country: "Netherlands" },
  { re: /ireland|dublin|cork/i, country: "Ireland" },
  { re: /israel|tel[- ]aviv|haifa/i, country: "Israel" },
  { re: /australia|sydney|melbourne|brisbane/i, country: "Australia" },
  { re: /singapore/i, country: "Singapore" },
  { re: /japan|tokyo|osaka|kyoto/i, country: "Japan" },
  { re: /china|shanghai|beijing|shenzhen|hong kong/i, country: "China" },
  { re: /france|paris|lyon/i, country: "France" },
  { re: /sweden|stockholm/i, country: "Sweden" },
  { re: /denmark|copenhagen/i, country: "Denmark" },
  { re: /spain|madrid|barcelona/i, country: "Spain" },
  { re: /poland|warsaw|krakow/i, country: "Poland" },
  { re: /brazil|são paulo|sao paulo/i, country: "Brazil" },
  { re: /mexico|mexico city|cabo/i, country: "Mexico" },
  { re: /uae|dubai|abu dhabi/i, country: "United Arab Emirates" },
  { re: /qatar|doha/i, country: "Qatar" },
  { re: /saudi|riyadh/i, country: "Saudi Arabia" },
  { re: /united states|usa|us\b|nyc|bay area|silicon valley/i, country: "United States" },
];

interface Row {
  company: string;
  role: string;
  location: string;
  terms?: string;
  age: number; // days since posted
  applyUrl: string;
  markers: string; // which legend emojis appeared in this row
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").trim();
}

function cleanField(s: string): string {
  let t = stripTags(s);
  for (const m of Object.values(MARKERS)) t = t.split(m).join("");
  return t.replace(/\s+/g, " ").trim();
}

function extractHrefs(cell: string): string[] {
  return [...cell.matchAll(/href="([^"]+)"/g)].map((m) => m[1]).filter((h) => h.startsWith("http"));
}

function pickApplyUrl(hrefs: string[]): string {
  const real = hrefs.find(
    (h) => h.startsWith("http") && !h.includes("simplify.jobs") && !h.includes("imgur")
  );
  return real || hrefs.find((h) => h.startsWith("http")) || "";
}

function parseAge(s: string): number {
  const m = s.trim().match(/^(\d+)\s*(d|w|mo|m|y)$/i);
  if (!m) return 0;
  const n = parseInt(m[1], 10);
  switch (m[2].toLowerCase()) {
    case "w": return n * 7;
    case "mo":
    case "m": return n * 30;
    case "y": return n * 365;
    default: return n;
  }
}

function detectCountries(location: string): string {
  const loc = location.toLowerCase();
  if (/remote/i.test(loc)) return "Global"; // remote roles span the US (see 🇺🇸 marker for citizenship limits)

  const found = new Set<string>();
  for (const rule of COUNTRY_RULES) {
    if (rule.re.test(loc)) found.add(rule.country);
  }

  // US-state patterns: "Seattle, WA", "NYC", "Boston, MA" — only if no
  // country keyword already claimed the location.
  if (found.size === 0) {
    const stateMatch = loc.match(/(?:,\s*|\s)([A-Za-z]{2})$/);
    if (stateMatch && US_STATES.has(stateMatch[1].toUpperCase())) found.add("US");
    if (/\bnyc\b|bay area|silicon valley|remote - us/i.test(loc)) found.add("US");
  }

  return found.size ? [...found].join(",") : "Global";
}

function detectDegree(row: Row): Degree {
  return row.markers.includes(MARKERS.advanced) ? "MASTER" : "ANY";
}

function detectType(row: Row): OppType {
  const t = `${row.company} ${row.role}`.toLowerCase();
  if (/research|scientist|\bphd\b|doctoral/.test(t)) return "RESEARCH_INTERNSHIP";
  return "INTERNSHIP";
}

function buildEligibility(row: Row): string {
  const parts: string[] = [];
  if (row.markers.includes(MARKERS.sponsorship)) parts.push("No visa sponsorship offered.");
  if (row.markers.includes(MARKERS.citizenship)) parts.push("US citizenship / work authorization required.");
  if (row.markers.includes(MARKERS.advanced)) parts.push("Advanced degree (Master's, PhD, MBA) required.");
  if (row.markers.includes(MARKERS.faang)) parts.push("FAANG+ / top-tier tech company.");
  parts.push("Rolling application — apply early; check the posting for exact eligibility and deadlines.");
  return parts.join(" ");
}

function parseTable(html: string, hasTerms: boolean): Row[] {
  const rows: Row[] = [];
  const tables = html.match(/<table>[\s\S]*?<\/table>/g) || [];
  let lastCompany = "";

  for (const table of tables) {
    const trs = table.match(/<tr>[\s\S]*?<\/tr>/g) || [];
    for (const tr of trs) {
      const cells = tr.match(/<t[dh]>[\s\S]*?<\/t[dh]>/g) || [];
      const texts = cells.map(stripTags).map((c) => c.replace(/\s+/g, " ").trim());
      if (!texts.length || texts[0] === "Company" || texts[0] === "") continue;

      let company = texts[0];
      if (company.startsWith("\u21b3") || company === "↳") {
        company = lastCompany;
      } else {
        lastCompany = cleanField(company);
      }
      company = cleanField(company);
      if (!company) continue;

      const roleCell = cells[1] || "";
      const role = cleanField(roleCell);
      const location = cleanField(cells[2] || "");

      // Application cell holds the apply + simplify links; Terms (off-season)
      // shifts everything right by one column.
      const appIdx = hasTerms ? 4 : 3;
      const applyUrl = pickApplyUrl(extractHrefs(cells[appIdx] || ""));
      const terms = hasTerms ? stripTags(cells[3] || "").trim() : undefined;
      const age = parseAge(texts[texts.length - 1] || "0d");

      // The raw HTML of the whole row holds the legend markers.
      const markers = (tr.match(/[\u{1F512}\u{1F1FA}\u{1F1F8}\u{1F6C2}\u{1F393}\u{1F525}]/gu) || []).join("");

      rows.push({ company, role, location, terms, age, applyUrl, markers });
    }
  }
  return rows;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);
}

async function importList(
  label: string,
  rows: Row[],
  guidPrefix: string
): Promise<{ created: number; updated: number; removed: number }> {
  let created = 0;
  let updated = 0;
  const seen = new Set<string>();
  const closedGuids: string[] = [];

  for (const row of rows) {
    const locationKey = slugify(row.location).slice(0, 40);
    const key = `${slugify(row.company)}|${slugify(row.role)}|${locationKey}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const guid = `github:${guidPrefix}:${key}`.slice(0, 190);

    // 🔒-marked rows are closed applications — never import them as live
    // opportunities, and purge any that a previous run already created.
    if (row.markers.includes(MARKERS.closed)) {
      closedGuids.push(guid);
      continue;
    }

    const data = {
      company: row.company,
      title: row.role,
      description: null,
      eligibility: buildEligibility(row),
      // Canonical-name insurance: even if a rule changes, the stored value
      // stays in sync with lib/countries.ts's alias map.
      countries: normalizeCountriesField(detectCountries(row.location)),
      degree: detectDegree(row),
      type: detectType(row),
      deadline: null, // the list carries no deadlines — Age is days-since-posted
      applyUrl: row.applyUrl || "https://simplify.jobs/",
      sourceFeed: `GitHub SimplifyJobs (${label})`,
      publishedAt: new Date(Date.now() - row.age * 86400000),
    };

    const existing = await prisma.opportunity.findUnique({ where: { guid } });
    if (existing) {
      await prisma.opportunity.update({ where: { guid }, data });
      updated++;
    } else {
      await prisma.opportunity.create({ data: { ...data, guid } });
      created++;
    }
  }

  let removed = 0;
  if (closedGuids.length) {
    const del = await prisma.opportunity.deleteMany({
      where: {
        guid: { in: closedGuids },
        sourceFeed: { startsWith: "GitHub SimplifyJobs" },
      },
    });
    removed = del.count;
  }
  return { created, updated, removed };
}

async function main() {
  const [mainMd, offMd] = await Promise.all([
    fetch(MAIN_URL, { headers: { "User-Agent": "Buffy/1.0 (internship-tracker import)" } }).then((r) => {
      if (!r.ok) throw new Error(`main README: HTTP ${r.status}`);
      return r.text();
    }),
    fetch(OFFSEASON_URL, { headers: { "User-Agent": "Buffy/1.0 (internship-tracker import)" } }).then((r) => {
      if (!r.ok) throw new Error(`off-season README: HTTP ${r.status}`);
      return r.text();
    }),
  ]);

  // Summer 2027 main list — all live roles.
  const mainRows = parseTable(mainMd, false);
  console.log(`Main list: ${mainRows.length} role rows parsed.`);

  // Off-season — upcoming terms only, most-recent first, deduped by company+role.
  const offRows = parseTable(offMd, true)
    .filter((r) => r.terms && UPCOMING_TERMS.some((t) => (r.terms || "").includes(t)))
    .sort((a, b) => a.age - b.age);

  const deduped: Row[] = [];
  const seenRole = new Set<string>();
  for (const r of offRows) {
    const key = `${slugify(r.company)}|${slugify(r.role)}`;
    if (seenRole.has(key)) continue;
    seenRole.add(key);
    deduped.push(r);
  }
  const offSlice = deduped.slice(0, MAX_OFFSEASON_ROLES);
  console.log(`Off-season: ${offRows.length} upcoming rows, deduped to ${deduped.length}, importing ${offSlice.length}.`);

  const mainRes = await importList("Summer 2027", mainRows, "simplify-2027");
  const offRes = await importList("Off-Season", offSlice, "simplify-off");

  await prisma.$disconnect();
  console.log(
    `GitHub import complete — main: ${mainRes.created} created, ${mainRes.updated} updated, ${mainRes.removed} closed removed; ` +
    `off-season: ${offRes.created} created, ${offRes.updated} updated, ${offRes.removed} closed removed.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
