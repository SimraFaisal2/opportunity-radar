"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, BriefcaseBusiness, FlaskConical, GraduationCap, ArrowRight, MapPinned } from "lucide-react";
import { flagFor, isRegion } from "@/lib/countries";
import CountryFlag from "@/components/CountryFlag";

interface CountryCounts {
  name: string;
  internships: number;
  research: number;
  scholarships: number;
  total: number;
}

export default function CountriesPage() {
  const [countries, setCountries] = useState<CountryCounts[]>([]);
  const [distinct, setDistinct] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/countries");
        const data = await res.json();
        setCountries(data.countries || []);
        setDistinct(data.distinct || 0);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    const list = t ? countries.filter((c) => c.name.toLowerCase().includes(t)) : countries;
    // Countries first (biggest first), regions/Global at the bottom.
    return [...list].sort((a, b) => {
      const ra = isRegion(a.name) ? 1 : 0;
      const rb = isRegion(b.name) ? 1 : 0;
      return ra - rb || b.total - a.total || a.name.localeCompare(b.name);
    });
  }, [countries, q]);

  // Per-country totals double-count multi-country listings; the header shows
  // the distinct row total instead, and each card shows its own count.
  const grandTotal = countries.reduce((s, c) => s + c.total, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-ink mb-0.5 flex items-center gap-2">
            <MapPinned size={22} className="text-accent" /> Opportunities by Country
          </h1>
          <p className="text-inkDim text-sm">
            {countries.length} countries &amp; regions · {distinct} distinct opportunities ({grandTotal} across countries). Pick one to see what's open.
          </p>
        </div>
        <Link href="/board" className="duo-btn duo-btn-white px-4 py-2 text-sm">
          Open full board <ArrowRight size={14} />
        </Link>
      </div>

      <div className="relative max-w-sm mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-inkDim" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a country…"
          className="input pl-9"
        />
      </div>

      {loading ? (
        <p className="text-inkDim text-sm">Loading countries…</p>
      ) : filtered.length === 0 ? (
        <p className="text-inkDim text-sm py-12 text-center">No countries match “{q}”.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((c) => (
            <Link
              key={c.name}
              href={`/board?country=${encodeURIComponent(c.name)}`}
              className="card p-5 flex flex-col hover:border-accent/50 group transition-colors duration-200"
            >
              <div className="flex items-center gap-3 mb-3">
                <CountryFlag name={c.name} className="text-4xl" />
                <div className="min-w-0">
                  <p className="font-display font-extrabold text-ink text-base truncate">{c.name}</p>
                </div>
                <span className="ml-auto bg-accent text-[#0A0A0A] text-sm font-bold rounded-lg px-2.5 py-1">
                  {c.total}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-auto">
                <span className="flex items-center gap-1 text-[11px] font-bold text-sky bg-skySoft border border-sky/30 rounded-lg px-2 py-1">
                  <BriefcaseBusiness size={11} /> {c.internships}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-grape bg-grapeSoft border border-grape/30 rounded-lg px-2 py-1">
                  <FlaskConical size={11} /> {c.research}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-sun bg-sunSoft border border-sun/30 rounded-lg px-2 py-1">
                  <GraduationCap size={11} /> {c.scholarships}
                </span>
                <ArrowRight size={14} className="ml-auto text-inkFaint group-hover:text-accent group-hover:translate-x-0.5 transition-all duration-200" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
