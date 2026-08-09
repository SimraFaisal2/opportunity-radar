"use client";

import { useEffect, useMemo, useState } from "react";
import {
  RefreshCw, ExternalLink, Plus, Check, Globe2, BriefcaseBusiness, GraduationCap,
  LayoutGrid, FlaskConical, Search, ChevronDown, ChevronUp, ChevronsUpDown, Layers,
  List, Rows3, Code2, Cog, Shapes, Sparkles, Sun,
} from "lucide-react";
import clsx from "clsx";
import { flagFor, normalizeCountry } from "@/lib/countries";
import CountryFlag from "@/components/CountryFlag";
import { FIELDS, FIELD_BY_KEY, FieldKey, freshnessLabel, SPONSOR_META } from "@/lib/fields";

type Degree = "ALL" | "BACHELOR" | "MASTER" | "PHD" | "ANY";
type OppType = "ALL" | "INTERNSHIP" | "RESEARCH_INTERNSHIP" | "SCHOLARSHIP" | "SUMMER_SCHOOL";
type SponsorFilter = "ACADEMIC" | "CORPORATE" | "ALL";
type Layout = "list" | "grid";
type TemplateKey = "all" | "cs" | "engineering" | "aurora";

interface Opportunity {
  id: string;
  company: string;
  title: string;
  deadline: string | null;
  degree: Degree;
  type: string;
  countries: string;
  eligibility: string | null;
  applyUrl: string;
  sourceFeed: string;
  publishedAt: string | null;
  field: string;
  sponsor: "ACADEMIC" | "CORPORATE";
  summerSchool: boolean;
  application: { id: string } | null;
}

const TYPE_FILTERS: { key: OppType; label: string; icon: any; active: string }[] = [
  { key: "ALL", label: "Everything", icon: LayoutGrid, active: "bg-accent/15 text-accent border-accent/50" },
  { key: "INTERNSHIP", label: "Internships", icon: BriefcaseBusiness, active: "bg-sky/15 text-sky border-sky/50" },
  { key: "RESEARCH_INTERNSHIP", label: "Research", icon: FlaskConical, active: "bg-grape/15 text-grape border-grape/50" },
  { key: "SUMMER_SCHOOL", label: "Summer Schools", icon: Sun, active: "bg-sun/20 text-sun border-sun/60" },
  { key: "SCHOLARSHIP", label: "Scholarships", icon: GraduationCap, active: "bg-sun/15 text-sun border-sun/50" },
];

const DEGREE_FILTERS: { key: Degree; label: string }[] = [
  { key: "ALL", label: "All degrees" },
  { key: "BACHELOR", label: "Bachelor" },
  { key: "MASTER", label: "Master" },
  { key: "PHD", label: "PhD" },
];

// Shared column template for the radar list header + rows (md+). Both sides
// use the exact same track widths, so header labels stay glued to the data
// beneath them. Tracks: # · Role · Location · Deadline · Freshness · Actions.
const LIST_GRID = "grid-cols-[2rem_minmax(0,1fr)_8.5rem_6.5rem_7rem_11rem]";

// One dark surface system for the whole board; templates only re-skin the
// accent (buttons, chips, row edges, glow) — never the surfaces.
const SURFACE = {
  panel: "bg-[#101010] border border-hairline rounded-lg",
  chipIdle: "bg-transparent border border-hairline text-inkDim hover:text-ink hover:border-hairlineStrong",
  mutedIdle: "text-inkFaint hover:text-ink",
  head: "text-ink",
  sub: "text-inkDim",
  title: "text-inkDim",
  company: "text-ink",
  muted: "text-inkFaint",
  border: "border-hairline",
  tracked: "border-leaf/40 bg-leafSoft text-leaf",
  trackBtn: "btn-ghost !px-2.5 !py-1 !text-xs",
  degree: "text-inkDim bg-white/[0.05] border-hairline",
  eligBox: "bg-white/[0.03] border border-hairline text-inkDim",
  row: "border-b border-hairline/60 hover:bg-white/[0.03]",
  cardHover: "hover:border-white/15 hover:bg-surfaceHover",
};

// Template themes: each one accents the same dark board differently.
const TEMPLATES: Record<
  TemplateKey,
  {
    label: string;
    icon: any;
    kicker: string;
    btn: string;       // primary button
    chip: string;      // active chip
    rowAccent: string; // left edge on list rows
    link: string;       // apply / "who can apply" links
    accentText: string; // hero highlight word
    glow: string;       // hero radial glow CSS
    pillRing: string;  // ring on field pills
  }
> = {
  all: {
    label: "All fields",
    icon: Shapes,
    kicker: "Internships, research & scholarships from live feeds — ranked newest first, deadlines counted down.",
    btn: "bg-accent text-[#0A0A0A] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_1px_3px_rgba(0,0,0,0.5)] hover:bg-accentBright",
    chip: "bg-accent/15 text-accent border-accent/50",
    rowAccent: "border-l-accent",
    link: "text-accent hover:text-accentBright",
    accentText: "text-accent",
    glow: "radial-gradient(58% 55% at 50% 0%, rgba(167,139,250,0.13) 0%, rgba(167,139,250,0.04) 45%, transparent 75%)",
    pillRing: "",
  },
  cs: {
    label: "CS",
    icon: Code2,
    kicker: "Terminal view — software, systems & data-science roles, accented in cyan.",
    btn: "bg-sky text-[#04141F] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_1px_3px_rgba(0,0,0,0.5)] hover:bg-[#7DD3FC]",
    chip: "bg-sky/15 text-sky border-sky/50",
    rowAccent: "border-l-sky",
    link: "text-sky hover:text-[#7DD3FC]",
    accentText: "text-sky",
    glow: "radial-gradient(58% 55% at 50% 0%, rgba(56,189,248,0.12) 0%, rgba(56,189,248,0.04) 45%, transparent 75%)",
    pillRing: "ring-1 ring-sky/30",
  },
  engineering: {
    label: "Engineering",
    icon: Cog,
    kicker: "Blueprint view — mechanical, electrical, chemical & hardware roles, accented in amber.",
    btn: "bg-sun text-[#1A1000] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_1px_3px_rgba(0,0,0,0.5)] hover:bg-[#FDE68A]",
    chip: "bg-sun/15 text-sun border-sun/50",
    rowAccent: "border-l-sun",
    link: "text-sun hover:text-[#FDE68A]",
    accentText: "text-sun",
    glow: "radial-gradient(58% 55% at 50% 0%, rgba(251,191,36,0.11) 0%, rgba(251,191,36,0.04) 45%, transparent 75%)",
    pillRing: "ring-1 ring-sun/30",
  },
  aurora: {
    label: "Aurora",
    icon: Sparkles,
    kicker: "Leonardo-style — violet → magenta → cyan gradients with a soft glow.",
    btn: "bg-gradient-to-r from-accent via-[#E879F9] to-[#22D3EE] text-[#0A0A0A] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_4px_rgba(167,139,250,0.35)] hover:brightness-110",
    chip: "bg-gradient-to-r from-accent/20 via-[#E879F9]/20 to-[#22D3EE]/20 text-accentBright border-[#E879F9]/40",
    rowAccent: "border-l-[#C084FC]",
    link: "text-accentBright hover:text-white",
    accentText: "text-transparent bg-clip-text bg-gradient-to-r from-accent via-[#E879F9] to-[#22D3EE]",
    glow: "radial-gradient(50% 55% at 28% 0%, rgba(167,139,250,0.18) 0%, transparent 62%), radial-gradient(50% 55% at 72% 0%, rgba(232,121,249,0.15) 0%, transparent 62%), radial-gradient(45% 45% at 50% 105%, rgba(34,211,238,0.08) 0%, transparent 60%)",
    pillRing: "ring-1 ring-[#E879F9]/30",
  },
};

export default function BoardPage() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [countries, setCountries] = useState<string[]>([]);
  const [type, setType] = useState<OppType>("ALL");
  // Research tab defaults to institute programs — corporate R&D (TikTok,
  // quant firms…) only appears if you explicitly pick "Company R&D"/"All".
  const [sponsor, setSponsor] = useState<SponsorFilter>("ACADEMIC");
  const [degree, setDegree] = useState<Degree>("ALL");
  const [field, setField] = useState<string>("ALL");
  const [layout, setLayout] = useState<Layout>("list");
  const [template, setTemplate] = useState<TemplateKey>("all");
  // Lazy-init from the URL so a ?country= deep-link (Countries page) filters
  // the very first load instead of flashing all rows then re-fetching.
  const [country, setCountry] = useState(() => {
    if (typeof window === "undefined") return "ALL";
    return new URLSearchParams(window.location.search).get("country") ?? "ALL";
  });
  const [groupByCountry, setGroupByCountry] = useState(false);
  // asc matches the API's default (soonest-first), so the first click flips to
  // desc instead of being a silent no-op.
  const [deadlineSort, setDeadlineSort] = useState<"asc" | "desc">("asc");
  const [q, setQ] = useState("");
  const [expandedElig, setExpandedElig] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [trackingId, setTrackingId] = useState<string | null>(null);

  const T = TEMPLATES[template];

  async function load() {
    setLoading(true);
    // Summer Schools spans research internships AND some scholarships — it's
    // its own derived category, so pass type=ALL and the summerSchool flag.
    const params = new URLSearchParams({ degree, type: type === "SUMMER_SCHOOL" ? "ALL" : type });
    if (country !== "ALL") params.set("country", country);
    if (q.trim()) params.set("q", q.trim());
    if (field !== "ALL") params.set("field", field);
    // Sponsor only applies to the Research tab; ignore it elsewhere so it
    // never hides Internship/Scholarship rows.
    if (type === "RESEARCH_INTERNSHIP" && sponsor !== "ALL") params.set("sponsor", sponsor);
    if (type === "SUMMER_SCHOOL") params.set("summerSchool", "1");
    const res = await fetch(`/api/opportunities?${params.toString()}`);
    const data = await res.json();
    setItems(data.opportunities || []);
    setLoading(false);
  }

  // Build the country dropdown once from the full unfiltered dataset (Global
  // and regions included, so the Global card's deep-link works), and apply a
  // ?country= deep-link that arrived before the list was ready.
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/opportunities");
      const data = await res.json();
      const list = data.opportunities || [];
      setTotalCount(list.length);
      const set = new Set<string>();
      for (const op of list) {
        for (const c of (op.countries || "").split(",")) {
          // Normalize aliases ("UK" → "United Kingdom") so the dropdown has
          // one entry per country, matching the flag map and the filter.
          const t = normalizeCountry(c.trim());
          // Global is always rendered as a pinned last option — avoid a duplicate.
          if (t && t !== "Global") set.add(t);
        }
      }
      let cs = [...set].sort();
      // Pakistan is hidden from browsing (see /api/opportunities), so it won't
      // be in the dropdown — keep it selectable only when the page was opened
      // straight from the Countries card's deep-link.
      const fromUrl = new URLSearchParams(window.location.search).get("country");
      if (fromUrl === "Pakistan" && !cs.includes("Pakistan")) cs = [...cs, "Pakistan"];
      setCountries(cs);

      if (fromUrl && fromUrl !== "ALL" && (cs.includes(fromUrl) || fromUrl === "Global")) {
        setCountry(fromUrl);
      }
    })();
  }, []);

  // Debounce the search box so typing doesn't hammer the API.
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [type, degree, country, q, field, sponsor]);

  // When leaving the Research tab, clear the sponsor filter so it can't leak
  // into the Internships/Scholarships views.
  useEffect(() => {
    if (type !== "RESEARCH_INTERNSHIP") setSponsor("ACADEMIC");
  }, [type]);

  async function handleSync() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch("/api/opportunities/sync", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        const created = data.results.reduce((s: number, r: any) => s + r.created, 0);
        setSyncMsg(`Synced — ${created} new listing${created === 1 ? "" : "s"} added.`);
        await load();
      } else {
        setSyncMsg("Sync failed. Check your network settings and try again.");
      }
    } catch {
      setSyncMsg("Sync failed. Check your network settings and try again.");
    }
    setSyncing(false);
  }

  async function handleTrack(oppId: string) {
    setTrackingId(oppId);
    await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opportunityId: oppId }),
    });
    await load();
    setTrackingId(null);
  }

  const kindBadge = (op: Opportunity) => {
    if (op.type === "SCHOLARSHIP") return { label: "Scholarship", cls: "text-sun bg-sunSoft border-sun/30" };
    if (op.type === "RESEARCH_INTERNSHIP") return { label: "Research", cls: "text-grape bg-grapeSoft border-grape/30" };
    if (op.type === "INTERNSHIP") return { label: "Internship", cls: "text-sky bg-skySoft border-sky/30" };
    return { label: "Opportunity", cls: "text-inkDim bg-white/[0.05] border-hairline" };
  };

  const fieldMeta = (op: Opportunity) => FIELD_BY_KEY[(op.field as FieldKey) || "OTHER"] ?? FIELD_BY_KEY.OTHER;

  const primaryCountry = (op: Opportunity) => {
    const first = (op.countries || "Global").split(",")[0].trim();
    return first || "Global";
  };

  // Client-side deadline sort (the API returns soonest-first by default, so
  // asc mirrors it; desc reverses). Null-deadline rows always sink last.
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return deadlineSort === "asc" ? da - db : db - da;
    });
  }, [items, deadlineSort]);

  const groups = useMemo(() => {
    if (!groupByCountry) return null;
    const m = new Map<string, Opportunity[]>();
    // Group from the sorted list so the deadline sort applies within each
    // country group too (otherwise the header chevron would lie).
    for (const op of sortedItems) {
      const pc = primaryCountry(op);
      const arr = m.get(pc) ?? [];
      arr.push(op);
      m.set(pc, arr);
    }
    // Global last, otherwise biggest groups first.
    return [...m.entries()].sort((a, b) => {
      const ra = a[0] === "Global" ? 1 : 0;
      const rb = b[0] === "Global" ? 1 : 0;
      return ra - rb || b[1].length - a[1].length || a[0].localeCompare(b[0]);
    });
  }, [items, groupByCountry]);

  // Freshness tones tuned for the dark surface.
  const freshnessTone = (fr: { label: string; tone: string }) => {
    if (fr.tone === "text-leafDark") return "text-leaf";
    if (fr.tone === "text-skyDark") return "text-sky";
    return "text-inkFaint";
  };
  const freshnessDot = (fr: { dot: string }) => {
    if (fr.dot === "bg-leaf") return "bg-leaf";
    if (fr.dot === "bg-sky") return "bg-sky";
    return "bg-white/25";
  };

  const renderFieldPill = (op: Opportunity) => {
    const meta = fieldMeta(op);
    return (
      <span className={clsx("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 flex items-center gap-1.5", meta.badge, T.pillRing)}>
        <span className={clsx("w-1.5 h-1.5 rounded-full", meta.dot)} /> {meta.label}
      </span>
    );
  };

  const renderActions = (op: Opportunity) => (
    <div className="flex items-center gap-2.5 shrink-0">
      <a
        href={op.applyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={clsx("flex items-center gap-1 text-xs font-bold transition-colors", T.link)}
      >
        Apply Now <ExternalLink size={11} />
      </a>
      <button
        onClick={() => handleTrack(op.id)}
        disabled={!!op.application || trackingId === op.id}
        className={clsx(
          op.application
            ? clsx("flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border cursor-default", SURFACE.tracked)
            : clsx("px-2.5 py-1 text-xs", SURFACE.trackBtn)
        )}
      >
        {op.application ? <Check size={11} /> : <Plus size={11} />}
        {op.application ? "Tracked" : "Track"}
      </button>
    </div>
  );

  // Radar-style list row: rank, role stack, tags, location, deadline, freshness.
  const renderRow = (op: Opportunity, idx: number) => {
    const kind = kindBadge(op);
    const fr = freshnessLabel(op.publishedAt);
    const showElig = op.eligibility && (op.type === "RESEARCH_INTERNSHIP" || op.type === "INTERNSHIP");
    const expanded = expandedElig === op.id;
    return (
      <div
        key={op.id}
        className={clsx(
          "border-l-2 flex flex-col md:grid items-stretch md:items-center gap-2 md:gap-5 px-4 py-3",
          SURFACE.row,
          T.rowAccent,
          LIST_GRID
        )}
      >
        <span className={clsx("font-mono text-[11px] w-8 shrink-0 tabular-nums", SURFACE.muted)}>{idx + 1}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={clsx("font-display font-semibold text-sm truncate", SURFACE.company)}>{op.company}</span>
            {renderFieldPill(op)}
            <span className={clsx("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0", kind.cls)}>
              {kind.label}
            </span>
            {op.type === "RESEARCH_INTERNSHIP" && !op.summerSchool && (
              <span
                title={SPONSOR_META[op.sponsor].label}
                className={clsx("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0", SPONSOR_META[op.sponsor].badge)}
              >
                {SPONSOR_META[op.sponsor].short}
              </span>
            )}
            {op.summerSchool && (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 text-sun bg-sunSoft border-sun/30">
                Summer school
              </span>
            )}
            {op.degree !== "ANY" && (
              <span className={clsx("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0", SURFACE.degree)}>
                {op.degree}
              </span>
            )}
          </div>
          <p className={clsx("text-sm truncate mt-0.5", SURFACE.title)}>{op.title}</p>
          {showElig && (
            <div className="mt-1.5">
              <button
                onClick={() => setExpandedElig(expanded ? null : op.id)}
                className={clsx("flex items-center gap-1 text-xs font-bold hover:underline transition-colors", T.link)}
              >
                {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                Who can apply?
              </button>
              {expanded && (
                <p className={clsx("mt-1.5 text-xs leading-relaxed rounded-lg px-3 py-2.5", SURFACE.eligBox)}>
                  {op.eligibility}
                </p>
              )}
            </div>
          )}
        </div>
        {/* Mobile: one compact info line (hidden on md where the columns take over). */}
        <div className="flex items-center gap-x-4 gap-y-1 flex-wrap pl-12 text-xs font-mono md:hidden">
          <span className="flex items-center gap-1 min-w-0">
            <CountryFlag name={primaryCountry(op)} className="shrink-0" />
            <span className="truncate">{op.countries}</span>
          </span>
          <span className="tabular-nums">{op.deadline ? `Due ${new Date(op.deadline).toLocaleDateString()}` : "Undated"}</span>
          <span className={clsx("flex items-center gap-1.5", freshnessTone(fr))}>
            <span className={clsx("w-1.5 h-1.5 rounded-full", freshnessDot(fr))} />
            {fr.label}
          </span>
        </div>
        {/* Desktop columns — each sits in its own grid track, matching the header. */}
        <div className={clsx("hidden md:flex items-center gap-1 min-w-0 text-xs font-mono", SURFACE.muted)}>
          <CountryFlag name={primaryCountry(op)} className="shrink-0" />
          <span className="truncate min-w-0">{op.countries}</span>
        </div>
        <div className={clsx("hidden md:block text-xs font-mono tabular-nums min-w-0", SURFACE.muted)}>
          {op.deadline ? `Due ${new Date(op.deadline).toLocaleDateString()}` : "Undated"}
        </div>
        <div className={clsx("hidden md:flex items-center gap-1.5 min-w-0", freshnessTone(fr))}>
          <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", freshnessDot(fr))} />
          <span className="text-xs font-mono truncate">{fr.label}</span>
        </div>
        {/* Actions — left-aligned on md+ (header starts where Apply Now
            starts); on mobile it stays a full-width row after the info line. */}
        <div className="flex justify-start min-w-0">
          {renderActions(op)}
        </div>
      </div>
    );
  };

  // Card grid (the classic view), with field pill + freshness added.
  const renderCard = (op: Opportunity) => {
    const kind = kindBadge(op);
    const fr = freshnessLabel(op.publishedAt);
    const showElig = op.eligibility && (op.type === "RESEARCH_INTERNSHIP" || op.type === "INTERNSHIP");
    const expanded = expandedElig === op.id;
    return (
      <div key={op.id} className={clsx("p-4 flex flex-col card", SURFACE.cardHover)}>
        <div className="flex items-center justify-between mb-1.5 gap-2">
          <span className={clsx("font-display font-semibold text-sm truncate", SURFACE.company)}>{op.company}</span>
          <span className={clsx("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0", kind.cls)}>
            {kind.label}
          </span>
        </div>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {renderFieldPill(op)}
          {op.type === "RESEARCH_INTERNSHIP" && !op.summerSchool && (
            <span
              title={SPONSOR_META[op.sponsor].label}
              className={clsx("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0", SPONSOR_META[op.sponsor].badge)}
            >
              {SPONSOR_META[op.sponsor].short}
            </span>
          )}
          {op.summerSchool && (
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 text-sun bg-sunSoft border-sun/30">
              Summer school
            </span>
          )}
          <span className={clsx("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0", SURFACE.degree)}>
            {op.degree === "ANY" ? "Any degree" : op.degree}
          </span>
        </div>
        <p className={clsx("text-sm mb-2.5 line-clamp-2", SURFACE.title)}>{op.title}</p>
        <div className={clsx("flex items-center gap-3 text-xs font-mono mb-3 flex-wrap", SURFACE.muted)}>
          {op.deadline && <span>Due {new Date(op.deadline).toLocaleDateString()}</span>}
          <span className="flex items-center gap-1">
            <CountryFlag name={primaryCountry(op)} />
            {op.countries}
          </span>
          <span className={clsx("flex items-center gap-1.5 font-bold", freshnessTone(fr))}>
            <span className={clsx("w-1.5 h-1.5 rounded-full", freshnessDot(fr))} /> {fr.label}
          </span>
        </div>

        {showElig && (
          <div className="mb-3">
            <button
              onClick={() => setExpandedElig(expanded ? null : op.id)}
              className={clsx("flex items-center gap-1 text-xs font-bold hover:underline transition-colors", T.link)}
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              Who can apply?
            </button>
            {expanded && (
              <p className={clsx("mt-1.5 text-xs leading-relaxed rounded-lg px-3 py-2.5", SURFACE.eligBox)}>
                {op.eligibility}
              </p>
            )}
          </div>
        )}

        <div className={clsx("mt-auto flex items-center gap-2 pt-2.5 border-t", SURFACE.border)}>
          {renderActions(op)}
        </div>
      </div>
    );
  };

  const typeWord = (t: OppType) =>
    t === "SCHOLARSHIP" ? "scholarships"
    : t === "RESEARCH_INTERNSHIP" ? "research internships"
    : t === "SUMMER_SCHOOL" ? "summer schools"
    : t === "INTERNSHIP" ? "internships"
    : "listings";
  const emptyMsg = q.trim()
    ? `No ${field !== "ALL" ? FIELD_BY_KEY[field as FieldKey]?.label.toLowerCase() + " " : ""}${typeWord(type)} match "${q.trim()}".`
    : `No ${field !== "ALL" ? FIELD_BY_KEY[field as FieldKey]?.label.toLowerCase() + " " : ""}${typeWord(type)} here yet — try another filter or hit Sync.`;

  return (
    <div className="relative">
      {/* Hero glow */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-28 h-[460px]" style={{ background: T.glow }} />

      <div className="relative">
        {/* Hero */}
        <div className="mb-10">
          <p className={clsx("font-mono text-[11px] tracking-[0.22em] uppercase font-medium mb-3", T.link)}>
            Opportunity radar
          </p>
          <h1 className="font-display font-bold text-4xl sm:text-5xl tracking-[-0.03em] text-ink leading-[1.05] mb-4">
            Live opportunities,
            <br />
            ranked <span className={T.accentText}>fresh</span>.
          </h1>
          <p className={clsx("text-[15px] max-w-xl leading-relaxed", SURFACE.sub)}>{T.kicker}</p>
          <div className="flex items-center gap-3 mt-6 flex-wrap">
            <span className="font-mono text-xs text-ink bg-white/[0.05] border border-hairline rounded-lg px-3 py-1.5 tabular-nums">
              {totalCount} live listings
            </span>
            <span className="font-mono text-xs text-ink bg-white/[0.05] border border-hairline rounded-lg px-3 py-1.5 tabular-nums">
              {countries.length} countries
            </span>
            <span className="font-mono text-xs text-inkDim px-1">newest first · deadlines counted down</span>
          </div>
        </div>

        {/* Template switcher + sync */}
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <div className={clsx("inline-flex rounded-lg p-1 gap-0.5", SURFACE.panel)}>
            {(Object.keys(TEMPLATES) as TemplateKey[]).map((k) => {
              const Icon = TEMPLATES[k].icon;
              const active = template === k;
              return (
                <button
                  key={k}
                  onClick={() => setTemplate(k)}
                  title={`${TEMPLATES[k].label} theme`}
                  className={clsx(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200",
                    active ? TEMPLATES[k].chip : SURFACE.mutedIdle
                  )}
                >
                  <Icon size={13} /> {TEMPLATES[k].label}
                </button>
              );
            })}
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className={clsx("duo-btn px-4 py-2 text-sm", T.btn)}
          >
            <RefreshCw size={14} className={clsx(syncing && "animate-spin")} />
            {syncing ? "Syncing…" : "Sync"}
          </button>
        </div>

        {syncMsg && <p className={clsx("text-sm mb-4", SURFACE.sub)}>{syncMsg}</p>}

        {/* Search + country + group + layout */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search size={14} className={clsx("absolute left-3 top-1/2 -translate-y-1/2", SURFACE.muted)} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search company, country, eligibility…"
              className={clsx("input pl-9")}
            />
          </div>
          <div className="flex items-center gap-2">
            <Globe2 size={15} className={SURFACE.muted} />
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              aria-label="Filter by country"
              className={clsx("input !w-auto cursor-pointer font-semibold")}
            >
              <option value="ALL">All countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>{flagFor(c)} {c}</option>
              ))}
              <option value="Global">Global</option>
            </select>
          </div>
          <button
            onClick={() => setGroupByCountry((g) => !g)}
            className={clsx(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold border transition-all duration-200",
              groupByCountry ? T.chip : SURFACE.chipIdle
            )}
          >
            <Layers size={14} />
            {groupByCountry ? "Ungroup" : "Group by country"}
          </button>
          <div className={clsx("inline-flex rounded-lg p-1 gap-0.5", SURFACE.panel)}>
            <button
              onClick={() => setLayout("list")}
              title="Radar list"
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200",
                layout === "list" ? T.chip : SURFACE.mutedIdle
              )}
            >
              <List size={13} /> List
            </button>
            <button
              onClick={() => setLayout("grid")}
              title="Card grid"
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200",
                layout === "grid" ? T.chip : SURFACE.mutedIdle
              )}
            >
              <Rows3 size={13} /> Grid
            </button>
          </div>
        </div>

        {/* Kind: everything / internships / research / scholarships */}
        <div className={clsx("inline-flex rounded-lg p-1 gap-0.5 mb-3", SURFACE.panel)}>
          {TYPE_FILTERS.map((f) => {
            const Icon = f.icon;
            const active = type === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setType(f.key)}
                className={clsx(
                  "flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-200",
                  active ? f.active : SURFACE.mutedIdle
                )}
              >
                <Icon size={14} />
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Field chips */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button
            onClick={() => setField("ALL")}
            className={clsx(
              "px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200",
              field === "ALL" ? T.chip : SURFACE.chipIdle
            )}
          >
            All fields
          </button>
          {FIELDS.map((f) => {
            const active = field === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setField(active ? "ALL" : f.key)}
                className={clsx(
                  "px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 flex items-center gap-1.5",
                  active ? T.chip : SURFACE.chipIdle
                )}
              >
                <span className={clsx("w-2 h-2 rounded-full", f.dot)} /> {f.label}
              </button>
            );
          })}
        </div>

        {/* Sponsor: institute vs company — only visible on the Research tab */}
        {type === "RESEARCH_INTERNSHIP" && (
          <div className={clsx("inline-flex rounded-lg p-1 gap-0.5 mb-3", SURFACE.panel)}>
            {([
              { key: "ACADEMIC" as SponsorFilter, label: "Institute programs", icon: GraduationCap },
              { key: "CORPORATE" as SponsorFilter, label: "Company R&D", icon: BriefcaseBusiness },
              { key: "ALL" as SponsorFilter, label: "All research", icon: FlaskConical },
            ]).map((f) => {
              const Icon = f.icon;
              const active = sponsor === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setSponsor(f.key)}
                  className={clsx(
                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-200",
                    active ? T.chip : SURFACE.mutedIdle
                  )}
                >
                  <Icon size={13} />
                  {f.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Degree: all / bachelor / master / phd */}
        <div className="flex items-center gap-2 mb-6">
          {DEGREE_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setDegree(f.key)}
              className={clsx(
                "px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200",
                degree === f.key ? T.chip : SURFACE.chipIdle
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {groups ? (
          <div className="space-y-8">
            {groups.map(([pc, ops]) => (
              <section key={pc}>
                <div className="flex items-center gap-2 mb-3">
                  <CountryFlag name={pc} className="text-xl" />
                  <h2 className={clsx("font-display font-bold text-lg tracking-tight", SURFACE.head)}>{pc}</h2>
                  <span className={clsx("text-xs font-semibold rounded-full px-2.5 py-0.5 border", SURFACE.muted, SURFACE.panel)}>
                    {ops.length} {ops.length === 1 ? "listing" : "listings"}
                  </span>
                </div>
                {layout === "list" ? (
                  <div className="space-y-2.5">{ops.map((op, i) => renderRow(op, i))}</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {ops.map(renderCard)}
                  </div>
                )}
              </section>
            ))}
            {!loading && items.length === 0 && (
              <p className={clsx("text-sm text-center py-12", SURFACE.muted)}>{emptyMsg}</p>
            )}
          </div>
        ) : layout === "list" ? (
          <div className="card overflow-hidden">
            {/* Radar-style column headers — one grid, shared track widths with
                the rows below so every label sits directly above its data. */}
            <div
              className={clsx(
                "hidden md:grid items-center gap-5 px-4 py-3 text-xs font-semibold tracking-[0.12em] bg-white/[0.03] border-b border-hairline",
                "text-inkFaint",
                LIST_GRID
              )}
              // 2px transparent left border mirrors the rows' template accent
              // (border-l-2) so the # column lines up with the rank numbers.
              style={{ borderLeft: "2px solid transparent" }}
            >
              <span>#</span>
              <span>Role</span>
              <span>Location</span>
              <span>
                <button
                  onClick={() => setDeadlineSort(deadlineSort === "asc" ? "desc" : "asc")}
                  title={deadlineSort === "desc" ? "Sorted latest first — click for soonest" : "Sorted soonest first — click for latest"}
                  className="group flex items-center gap-1 hover:text-ink transition-colors"
                >
                  Deadline
                  <ChevronsUpDown
                    size={12}
                    className={clsx(
                      "transition-all duration-200",
                      deadlineSort === "asc" ? "opacity-70 text-ink" : "opacity-100 text-ink rotate-180"
                    )}
                  />
                </button>
              </span>
              <span>Freshness</span>
              <span>Actions</span>
            </div>
            {sortedItems.map((op, i) => renderRow(op, i))}
            {!loading && items.length === 0 && (
              <div className="py-16 text-center">
                <p className={clsx("text-sm", SURFACE.muted)}>{emptyMsg}</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {items.map(renderCard)}
            </div>
            {!loading && items.length === 0 && (
              <p className={clsx("text-sm text-center py-12", SURFACE.muted)}>{emptyMsg}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
