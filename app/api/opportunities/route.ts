import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { detectField, detectSponsor, detectSummerSchool } from "@/lib/fields";
import { normalizeCountriesField, normalizeCountry } from "@/lib/countries";

// GET /api/opportunities?degree=MASTER&type=SCHOLARSHIP&country=Canada&q=CERN
//    &field=SOFTWARE&sponsor=ACADEMIC&summerSchool=1
export async function GET(req: NextRequest) {
  const degree = req.nextUrl.searchParams.get("degree");
  const type = req.nextUrl.searchParams.get("type");
  const country = req.nextUrl.searchParams.get("country");
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const field = req.nextUrl.searchParams.get("field");
  const sponsor = req.nextUrl.searchParams.get("sponsor");
  const summerSchool = req.nextUrl.searchParams.get("summerSchool");

  const where = {
    // degree=ANY listings ("any degree") belong to every filter — a Bachelor
    // student and a Master student should both see them.
    ...(degree && degree !== "ALL" ? { degree: { in: [degree, "ANY"] } } : {}),
    ...(type && type !== "ALL" ? { type } : {}),
    ...(q
      ? {
          OR: [
            { company: { contains: q } },
            { title: { contains: q } },
            { countries: { contains: q } },
            { eligibility: { contains: q } },
            { description: { contains: q } },
          ],
        }
      : {}),
  };

  // GitHub imports have no deadline — sort those last so real upcoming
  // deadlines stay on top (SQLite puts NULLs first in a plain asc order).
  const opportunities = await prisma.opportunity.findMany({
    where,
    orderBy: [{ deadline: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
    include: { application: true },
  });

  // Attach the discipline field, sponsor kind (academic institute vs corporate
  // R&D) and the summer-school flag — all computed from text at read time so
  // the board can badge/filter by Software, Engineering, Data, Institute vs
  // Company, and Summer Schools.
  let withField = opportunities.map((o) => {
    const sponsor = detectSponsor(o.title, o.company, o.description);
    return {
      ...o,
      field: detectField(o.title, o.company, o.description),
      sponsor,
      summerSchool: detectSummerSchool(o.title, o.company, o.description, sponsor),
    };
  });

  // Pakistan listings stay in the DB so the Countries page keeps its card,
  // but they're hidden from browsing (default board, tabs, calendar, the
  // country dropdown) unless the request explicitly targets Pakistan — which
  // only happens via the Countries card's deep-link (?country=Pakistan).
  const targetIsPakistan = !!country && normalizeCountry(country) === "Pakistan";
  if (!targetIsPakistan) {
    withField = withField.filter(
      (o) => !normalizeCountriesField(o.countries).split(",").map((c) => c.trim()).includes("Pakistan")
    );
  }

  // country is a comma-separated field ("Switzerland,Germany"). Match exact
  // comma-separated entries after normalization ("UK" == "United Kingdom")
  // rather than substring `contains` — short ISO aliases like "tr" (Turkey)
  // would otherwise match "Aus**tr**ia"/"Aus**tr**alia", and "de" would match
  // "Netherlan**de**s".
  if (country && country !== "ALL") {
    const canonical = normalizeCountry(country);
    withField = withField.filter((o) =>
      normalizeCountriesField(o.countries)
        .split(",")
        .map((c) => c.trim())
        .includes(canonical)
    );
  }

  if (field && field !== "ALL") {
    withField = withField.filter((o) => o.field === field);
  }

  if (sponsor && sponsor !== "ALL") {
    withField = withField.filter((o) => o.sponsor === sponsor);
  }

  if (summerSchool === "1") {
    withField = withField.filter((o) => o.summerSchool === true);
  }

  return NextResponse.json({ opportunities: withField });
}
