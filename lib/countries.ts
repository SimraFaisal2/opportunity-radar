// lib/countries.ts
//
// Single source of truth for country names + flags across the app.
//
// The Opportunity.countries column is a comma-separated list that historically
// mixed ISO codes ("US", "UK", "DE") with full names ("United States"). This
// module normalizes every value to one canonical name so the Countries page,
// the board's group-by-country mode, and the country filter all agree.

// Alias -> canonical display name.
const ALIASES: Record<string, string> = {
  "us": "United States",
  "usa": "United States",
  "united states": "United States",
  "uk": "United Kingdom",
  "united kingdom": "United Kingdom",
  "de": "Germany",
  "germany": "Germany",
  "au": "Australia",
  "australia": "Australia",
  "ca": "Canada",
  "canada": "Canada",
  "in": "India",
  "india": "India",
  "eu": "Europe",
  "europe": "Europe",
  "european union": "Europe",
  "uae": "United Arab Emirates",
  "united arab emirates": "United Arab Emirates",
  "sa": "Saudi Arabia",
  "saudi arabia": "Saudi Arabia",
  "fi": "Finland",
  "finland": "Finland",
  "ee": "Estonia",
  "estonia": "Estonia",
  "pt": "Portugal",
  "portugal": "Portugal",
  "no": "Norway",
  "norway": "Norway",
  "be": "Belgium",
  "belgium": "Belgium",
  "cz": "Czech Republic",
  "czech republic": "Czech Republic",
  "gr": "Greece",
  "greece": "Greece",
  "hu": "Hungary",
  "hungary": "Hungary",
  "ro": "Romania",
  "romania": "Romania",
  "jp": "Japan",
  "japan": "Japan",
  "sg": "Singapore",
  "singapore": "Singapore",
  "pk": "Pakistan",
  "pakistan": "Pakistan",
  "kr": "South Korea",
  "south korea": "South Korea",
  "korea": "South Korea",
  "cn": "China",
  "china": "China",
  "hk": "Hong Kong",
  "hong kong": "Hong Kong",
  "tr": "Turkey",
  "turkey": "Turkey",
};

// Canonical name -> ISO 3166-1 alpha-2 (drives the flag emoji).
const ISO: Record<string, string> = {
  "United States": "US",
  "United Kingdom": "GB",
  "Canada": "CA",
  "Germany": "DE",
  "Australia": "AU",
  "India": "IN",
  "Austria": "AT",
  "Switzerland": "CH",
  "France": "FR",
  "Spain": "ES",
  "Italy": "IT",
  "Sweden": "SE",
  "Denmark": "DK",
  "Bulgaria": "BG",
  "Netherlands": "NL",
  "Ireland": "IE",
  "Israel": "IL",
  "Singapore": "SG",
  "Pakistan": "PK",
  "Japan": "JP",
  "China": "CN",
  "Poland": "PL",
  "Brazil": "BR",
  "Mexico": "MX",
  "Finland": "FI",
  "Estonia": "EE",
  "Portugal": "PT",
  "Norway": "NO",
  "Czech Republic": "CZ",
  "Greece": "GR",
  "Hungary": "HU",
  "Romania": "RO",
  "Belgium": "BE",
  "Croatia": "HR",
  "Slovenia": "SI",
  "Slovakia": "SK",
  "Lithuania": "LT",
  "Latvia": "LV",
  "Luxembourg": "LU",
  "Turkey": "TR",
  "South Korea": "KR",
  "United Arab Emirates": "AE",
  "Qatar": "QA",
  "Saudi Arabia": "SA",
  "Hong Kong": "HK",
};

// Region / special buckets that aren't countries. Countries render as flag
// emoji; regions have no flag, so they fall back to two-letter initials in the
// same spirit (Europe keeps the EU flag, which renders like the rest).
const REGION_FLAG: Record<string, string> = {
  "Europe": "🇪🇺",
  "Africa": "AF",
  "Asia": "AS",
};

/** True when the flag mark for `name` is a plain two-letter initials code. */
export function flagIsInitials(name: string): boolean {
  return /^[A-Z]{2}$/.test(REGION_FLAG[name] ?? "");
}

export function normalizeCountry(raw: string): string {
  const t = (raw || "").trim();
  if (!t) return "Global";
  const lower = t.toLowerCase();
  return ALIASES[lower] ?? t;
}

/** Normalize a whole comma-separated countries field, deduped in order. */
export function normalizeCountriesField(raw: string | null | undefined): string {
  if (!raw) return "Global";
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const canon = normalizeCountry(part);
    if (canon && !out.includes(canon)) out.push(canon);
  }
  return out.length ? out.join(",") : "Global";
}

/** Flag emoji for a canonical country name (no icon for Global / unknown). */
export function flagFor(name: string): string {
  const iso = ISO[name];
  if (iso) {
    return String.fromCodePoint(
      ...[...iso].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
    );
  }
  return REGION_FLAG[name] ?? "";
}

/**
 * Every stored-value spelling that normalizes to `canonical` — including the
 * canonical name itself. Lets the API's `contains` filter match legacy raw
 * values ("UK", "eu") when a user picks the canonical name ("United Kingdom").
 */
export function aliasesFor(canonical: string): string[] {
  const out = [canonical];
  for (const [raw, canon] of Object.entries(ALIASES)) {
    if (canon === canonical) out.push(raw);
  }
  return out;
}

/** True for the non-country buckets (Global / regions). */
export function isRegion(name: string): boolean {
  return name === "Global" || name in REGION_FLAG;
}
