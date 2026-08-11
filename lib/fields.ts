// Field (discipline) classification for opportunities.
// Derived at read time from title/company/description — no schema change needed.
// Powers the radar-style list badges, the field filter chips, and the
// All / CS / Engineering template themes on the board.

export type FieldKey = "SOFTWARE" | "ENGINEERING" | "DATA" | "BUSINESS" | "DESIGN" | "SCIENCE" | "OTHER";

export interface FieldMeta {
  key: FieldKey;
  label: string;
  badge: string; // pill classes (per-field, used by the "All fields" template)
  dot: string;   // small status-dot color (freshness-style accents)
}

export const FIELDS: FieldMeta[] = [
  { key: "SOFTWARE", label: "Software", badge: "text-sky bg-skySoft border-sky/30", dot: "bg-sky" },
  { key: "ENGINEERING", label: "Engineering", badge: "text-sun bg-sunSoft border-sun/30", dot: "bg-sun" },
  { key: "DATA", label: "Data", badge: "text-grape bg-grapeSoft border-grape/30", dot: "bg-grape" },
  { key: "BUSINESS", label: "Business", badge: "text-coral bg-coralSoft border-coral/30", dot: "bg-coral" },
  { key: "DESIGN", label: "Design", badge: "text-leaf bg-leafSoft border-leaf/30", dot: "bg-leaf" },
  { key: "SCIENCE", label: "Science", badge: "text-[#0F766E] bg-[#0F766E]/[0.12] border-[#0F766E]/30", dot: "bg-[#0F766E]" },
  { key: "OTHER", label: "General", badge: "text-inkDim bg-black/[0.05] border-hairline", dot: "bg-inkFaint" },
];

export const FIELD_BY_KEY = Object.fromEntries(FIELDS.map((f) => [f.key, f])) as Record<FieldKey, FieldMeta>;

// Ordered rules — the first matching rule wins. SOFTWARE is checked before
// SCIENCE so "Computer Science Research Fellowship" classifies as Software,
// and DATA before SOFTWARE so "Data Engineer" isn't swallowed by "engineer".
const RULES: { key: FieldKey; patterns: RegExp }[] = [
  {
    key: "DATA",
    patterns:
      /data scien|data analys|data analyst|data engineer|data infra|data platform|analytics|biostat|statistician|data viz|database|mlops|data ops/i,
  },
  {
    key: "DESIGN",
    patterns:
      /\bux\b|\bui\b|user experience|user interface|product design|graphic design|visual design|branding|creative|illustrat|motion design|design intern/i,
  },
  {
    key: "SOFTWARE",
    patterns:
      /software|developer|develop|front-?end|back-?end|full-?stack|\bswe\b|\bsde\b|site reliability|devops|infrastructure|cloud|cyber|security engineer|platform engineer|systems engineer|programming|machine learning|\bai\b|artificial intelligence|computer science|data structures|algorithms|mobile|\bios\b|android|web developer|app developer|product engineer|\btech\b/i,
  },
  {
    key: "ENGINEERING",
    patterns:
      /mechanical|electrical|civil\b|chemical|aerospace|industrial engineer|structural|materials|automotive|robotics|hardware|embedded|chip|semiconductor|vlsi|firmware|process engineer|manufacturing|energy\b|power system|controls|thermal|nuclear|biomedical|test engineer|quality engineer|engineering\b|engineer/i,
  },
  {
    key: "SCIENCE",
    patterns:
      /research|science|biology|chemistry|physics|laboratory|\blab\b|genomics|bioinform|neurosci|immunol|biochem|microbio|astronomy|mathematics|\bmath\b|earth scien|environmental scien|summer school|\bmpia\b|max planck/i,
  },
  {
    key: "BUSINESS",
    patterns:
      /business|finance|financial|marketing|sales\b|consulting|consultant|product manager|product management|program manager|operations|human resources|\bhr\b|accounting|investment|banking|strategy|business analyst|commercial|leadership|people\b|management|supply chain|audit|actuarial/i,
  },
];

export function detectField(title: string, company = "", description: string | null = null): FieldKey {
  const text = [title, company, description ?? ""].filter(Boolean).join(" ");
  for (const rule of RULES) {
    if (rule.patterns.test(text)) return rule.key;
  }
  return "OTHER";
}

// ---------------------------------------------------------------------------
// Sponsor classification: is a RESEARCH_INTERNSHIP run by an academic
// institution (university / research institute / structured summer program)
// or by a company (corporate R&D internship)? Powers the Research tab's
// "Institute programs" vs "Company R&D" split.
// ---------------------------------------------------------------------------

export type Sponsor = "ACADEMIC" | "CORPORATE";

export const SPONSOR_META: Record<Sponsor, { label: string; short: string; badge: string }> = {
  ACADEMIC: { label: "Institute program", short: "INSTITUTE", badge: "text-grape bg-grapeSoft border-grape/30" },
  CORPORATE: { label: "Company R&D", short: "COMPANY", badge: "text-sky bg-skySoft border-sky/30" },
};

// Academic hosts: universities, research institutes and structured programs.
// The company field holds these names ("ETH Zurich (CS)", "MPIA", "CERN"…),
// so matching them there is reliable and case-consistent.
const ACADEMIC_COMPANY_HINTS = [
  "university", "universit", "institute", "polytechnique", "politecnico", "college",
  "mitacs", "globalink", "epfl", "eth ", "ethz", "rwth", "max planck", "mpia",
  "vienna biocenter", "biocenter", "john innes", "cern", "amgen", "inrs",
  "francis crick", "oxford", "hzdr", "insait", "ist austria", "ista", "embl",
  "surrey", "rochester", "pennsylvania state", "helmholtz", "forschungszentrum",
  "sfu", "simon fraser", "tudelft", "kth", "tum ", "ucl ", "imperial",
  "karolinska", "pasteur", "lund ", "uppsala", "ghent", "ethz",
  "cold spring harbor", "les houches", "oist", "okinawa", "kaist", "korea advanced",
  "kaust", "king abdullah", "weizmann", "utrip", "university of tokyo",
  "tsinghua", "caltech", "nus ", "national university of singapore",
  "max planck", "inria", "cea", "curie", "ictp", "sissa", "desy", "embo",
  "leibniz", "fraunhofer", "daad", "deutscher akademischer", "euroscholars",
];

// Structured-program phrasing in title/description. Kept tight on purpose:
// generic "research intern" / "research internship" appears in tons of
// corporate postings (e.g. "Quantitative Research Internship"), so those
// phrases are deliberately NOT academic signals.
const ACADEMIC_TEXT_HINTS = [
  "summer school", "summer research", "urop", "globalink", "summer student",
  "studentship", "scientific internship", "research program", "research assistant",
  "undergraduate research", "summer fellowship", "surf program", "amgen scholars",
];

const CORPORATE_COMPANY_HINTS = [
  "tiktok", "bytedance", "g-research", "jp morgan", "jpmorgan", "susquehanna", "imc trading",
  "optiver", "two sigma", "jump trading", "virtu", "walleye", "hudson river", "tower research",
  "squarepoint", "arrowstreet", "voloridge", "anthelion", "microsoft", "google", "amazon",
  "meta ", "apple", "netflix", "openai", "anthropic", "mistral", "cloudflare", "modal",
  "stripe", "palantir", "salesforce", "nvidia", "intel", "qualcomm", "keysight", "trend micro",
  "rtx", "rivian", "kirin", "neocognition", "phonic", "quadrillion", "frontier health",
  "veeda", "genmd", "egra", "architect labs", "opusclip", "warner", "calstart", "helsing",
  "city of austin", "yotta", "intelligenesis", "alixpartners", "hpr ", "hyannis", "neuralink",
];

// Company R&D role phrasing — quant, trading, and corporate scientist roles.
const CORPORATE_TEXT_HINTS = [
  "quantitative research", "quant researcher", "quant developer", "research scientist intern",
  "research engineer intern", "machine learning research intern", "applied scientist",
  "ai research intern", "ai scientist intern", "data scientist intern", "research analyst intern",
  "algorithm development", "equity volatility", "trust and safety", "monetization technology",
];

export function detectSponsor(title: string, company = "", description: string | null = null): Sponsor {
  const t = title.toLowerCase();
  const c = company.toLowerCase();
  const d = (description ?? "").toLowerCase();
  const text = `${t} ${d}`;

  // Known academic host in the company field — strongest signal.
  if (ACADEMIC_COMPANY_HINTS.some((k) => c.includes(k))) return "ACADEMIC";
  // Structured program phrasing in the title/description.
  if (ACADEMIC_TEXT_HINTS.some((k) => text.includes(k))) return "ACADEMIC";
  // Known corporate host or corporate R&D phrasing.
  if (CORPORATE_COMPANY_HINTS.some((k) => c.includes(k))) return "CORPORATE";
  if (CORPORATE_TEXT_HINTS.some((k) => text.includes(k))) return "CORPORATE";
  // Unrecognized host with a "research" flavor is most likely a company role.
  return "CORPORATE";
}

// ---------------------------------------------------------------------------
// Summer-school detection: SHORT, structured academic summer schools (roughly
// a few days to two weeks — "summer school", "summer academy", "summer
// institute", "summer course", "school of physics"). Only counts when the host
// is an academic institution.
//
// Deliberately EXCLUDED: multi-week summer research *internships* (EPFL, CERN,
// Mitacs Globalink, UROP, REU, SURF, UNIQ+, Amgen Scholars, DAAD RISE…). Those
// are 6–13 week research placements, not schools — even though the words
// "summer" and "research" appear in their titles. A summer school is defined
// by being a short structured teaching programme, so we match only the school
// vocabulary (school / academy / institute / session / course) and never the
// research-internship vocabulary.
// ---------------------------------------------------------------------------

const SUMMER_SCHOOL_PATTERNS = [
  "summer school", "summer academy", "summer institute", "summer session",
  "summer course", "school of physics", "summer science school", "summer school of",
];

// Phrases that identify multi-week research *internships* rather than short
// schools — if any appears, the listing is a research placement, not a school.
const SUMMER_INTERNSHIP_EXCLUDES = [
  "summer research", "summer student", "summer studentship", "summer fellowship",
  "summer intern", "summer internship", "\burop\b", "\breu\b", "\bsurf\b",
  "\buniq\b", "globalink", "studentship", "amgen scholars", "research internship",
  "research program", "research programme",
];

export function detectSummerSchool(title: string, company = "", description: string | null = null, sponsor: Sponsor = "CORPORATE"): boolean {
  const text = `${title} ${company} ${description ?? ""}`.toLowerCase();
  // Must be an academic institution program.
  if (sponsor !== "ACADEMIC") return false;
  // Must actually be a short school (school/academy/institute/session/course vocabulary).
  if (!SUMMER_SCHOOL_PATTERNS.some((p) => text.includes(p))) return false;
  // …and must NOT be a multi-week research placement.
  if (SUMMER_INTERNSHIP_EXCLUDES.some((p) => new RegExp(p).test(text))) return false;
  return true;
}

// How long ago a listing was published, radar-style ("Opened today").
export function freshnessLabel(publishedAt: string | null): { label: string; tone: string; dot: string } {
  if (!publishedAt) return { label: "Undated", tone: "text-inkDim", dot: "bg-line" };
  const days = Math.floor((Date.now() - new Date(publishedAt).getTime()) / 86_400_000);
  if (days <= 0) return { label: "Opened today", tone: "text-leafDark", dot: "bg-leaf" };
  if (days === 1) return { label: "Yesterday", tone: "text-skyDark", dot: "bg-sky" };
  if (days < 30) return { label: `${days} days ago`, tone: "text-inkDim", dot: "bg-line" };
  return { label: `${Math.floor(days / 30)} months ago`, tone: "text-inkDim", dot: "bg-line" };
}
