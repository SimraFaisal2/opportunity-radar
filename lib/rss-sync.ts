import Parser from "rss-parser";
import { prisma } from "./prisma";

// SQLite has no enum type, so degrees and kinds are plain strings with these allowed values.
type Degree = "BACHELOR" | "MASTER" | "PHD" | "ANY";
type OppType = "INTERNSHIP" | "RESEARCH_INTERNSHIP" | "SCHOLARSHIP" | "OTHER";

// -----------------------------------------------------------------------------
// Ported from the old Python/FastAPI RSS scraper.
// Original logic: fetch feed -> parse each item -> extract degree/country hints
// from title+description via keyword matching -> upsert into SQLite by guid.
// Here it's the same idea, just as a Next.js API route instead of a cron'd
// Python service.
// -----------------------------------------------------------------------------

const FEEDS: { name: string; url: string }[] = [
  { name: "Scholarships Corner", url: "https://scholarshipscorner.website/feed/" },
  { name: "Opportunities Corner", url: "https://opportunitiescorner.website/feed/" },
  // Broader student-opportunity sources beyond the original two feeds.
  { name: "Scholars4Dev", url: "https://www.scholars4dev.com/feed/" },
  { name: "Opportunities for Youth", url: "https://opportunitiesforyouth.org/feed/" },
];

const parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "Mozilla/5.0 (compatible; OpportunitiesBot/1.0)" },
});

function detectType(text: string, feedName: string): OppType {
  // Keywords first (most specific — an item can be a scholarship even on the
  // internships feed), then fall back to the feed's own name. Competitions,
  // prizes and fully-funded calls are funding opportunities, not internships.
  const t = text.toLowerCase();
  // Word-bounded so "award-winning" or a "pitch deck" don't misclassify.
  if (/\bscholarships?\b|\bfellowships?\b|\bgrant(?:s)?\b|\bcompetitions?\b|\bcontests?\b|\bprizes?\b|\baccelerators?\b|\bawards?\b|fully funded|call for proposals/i.test(t)) return "SCHOLARSHIP";
  if (/\bresearch\b|\breu\b|\bscientific\b|max planck|\bmpia\b|research intern|research assistant|summer research/.test(t)) return "RESEARCH_INTERNSHIP";
  if (/\binternship|\bintern\b|traineeship|apprenticeship/.test(t)) return "INTERNSHIP";
  if (feedName.toLowerCase().includes("scholarship")) return "SCHOLARSHIP";
  if (feedName.toLowerCase().includes("opportunit")) return "INTERNSHIP";
  return "OTHER";
}

function detectDegree(text: string): Degree {
  const t = text.toLowerCase();
  if (/\bphd\b|doctoral|doctorate/.test(t)) return "PHD";
  if (/\bmaster'?s?\b|\bmsc\b|\bma\b|\bmba\b/.test(t)) return "MASTER";
  if (/\bbachelor'?s?\b|\bbsc\b|\bba\b|undergraduate/.test(t)) return "BACHELOR";
  return "ANY";
}

function detectCountries(text: string): string {
  const t = text.toLowerCase();
  const found: string[] = [];
  // Canonical names — matches lib/countries.ts so the board's country filter
  // and the Countries page stay consistent.
  const map: Record<string, string> = {
    "united states": "United States",
    "usa": "United States",
    "united kingdom": "United Kingdom",
    "uk": "United Kingdom",
    "canada": "Canada",
    "germany": "Germany",
    "australia": "Australia",
    "india": "India",
    "european union": "Europe",
    "europe": "Europe",
    "africa": "Africa",
    "asia": "Asia",
    "worldwide": "Global",
    "international students": "Global",
    "all nationalities": "Global",
  };
  for (const [needle, code] of Object.entries(map)) {
    if (t.includes(needle) && !found.includes(code)) found.push(code);
  }
  return found.length ? found.join(",") : "Global";
}

function extractDeadline(text: string): Date | null {
  // Looks for patterns like "Deadline: March 15, 2027" or "Application Deadline: 2027-03-15"
  const patterns = [
    /deadline[:\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
    /deadline[:\s]+(\d{4}-\d{2}-\d{2})/i,
    /closing date[:\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const d = new Date(m[1]);
      if (!isNaN(d.getTime())) return d;
    }
  }
  return null;
}

function extractCompany(title: string): string {
  // Common feed title formats: "Company Name Internship 2027" or "Internship at Company Name"
  const atMatch = title.match(/\bat\s+([A-Z][A-Za-z0-9&.,\-\s]{2,40})/);
  if (atMatch) return atMatch[1].trim();
  // fallback: first 3-5 words up to a known keyword
  const stop = title.search(/\b(internship|scholarship|program|fellowship|traineeship)\b/i);
  if (stop > 2) return title.slice(0, stop).trim().replace(/[-–:]+$/, "");
  return title.slice(0, 40).trim();
}

export interface SyncResult {
  feed: string;
  fetched: number;
  created: number;
  skipped: number;
  error?: string;
}

export async function syncAllFeeds(): Promise<SyncResult[]> {
  const results: SyncResult[] = [];

  for (const feed of FEEDS) {
    const result: SyncResult = { feed: feed.name, fetched: 0, created: 0, skipped: 0 };
    try {
      const parsed = await parser.parseURL(feed.url);
      result.fetched = parsed.items.length;

      for (const item of parsed.items) {
        const guid = item.guid || item.link || `${feed.name}-${item.title}`;
        const existing = await prisma.opportunity.findUnique({ where: { guid } });
        if (existing) {
          result.skipped++;
          continue;
        }

        const fullText = `${item.title || ""} ${item.contentSnippet || item.content || ""}`;

        await prisma.opportunity.create({
          data: {
            company: extractCompany(item.title || "Unknown"),
            title: item.title || "Untitled opportunity",
            description: item.contentSnippet?.slice(0, 500) || null,
            deadline: extractDeadline(fullText),
            degree: detectDegree(fullText),
            type: detectType(fullText, feed.name),
            countries: detectCountries(fullText),
            applyUrl: item.link || feed.url,
            sourceFeed: feed.name,
            guid,
            publishedAt: item.isoDate ? new Date(item.isoDate) : null,
          },
        });
        result.created++;
      }
    } catch (err: any) {
      result.error = err?.message || "Unknown error fetching feed";
    }
    results.push(result);
  }

  return results;
}
