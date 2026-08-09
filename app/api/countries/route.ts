import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeCountriesField } from "@/lib/countries";

// GET /api/countries
// Returns every country found in the opportunities, with counts split by type.
// Multi-country rows (e.g. "Switzerland,Germany,France,United Kingdom,Sweden,Denmark")
// count toward each of their countries — that's what makes this a useful
// "opportunities available in X" view.
export async function GET() {
  const rows = await prisma.opportunity.findMany({
    select: { countries: true, type: true },
  });

  const map = new Map<
    string,
    { internships: number; research: number; scholarships: number; total: number }
  >();

  for (const r of rows) {
    for (const c of normalizeCountriesField(r.countries).split(",")) {
      const name = c.trim();
      if (!name) continue;
      const entry = map.get(name) ?? { internships: 0, research: 0, scholarships: 0, total: 0 };
      if (r.type === "INTERNSHIP") entry.internships++;
      else if (r.type === "RESEARCH_INTERNSHIP") entry.research++;
      else if (r.type === "SCHOLARSHIP") entry.scholarships++;
      entry.total++;
      map.set(name, entry);
    }
  }

  const countries = [...map.entries()]
    .map(([name, counts]) => ({ name, ...counts }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

  // `distinct` is the real number of Opportunity rows — per-country totals
  // double-count multi-country listings, so the page shows both.
  return NextResponse.json({ countries, distinct: rows.length });
}
