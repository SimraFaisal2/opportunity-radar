// scripts/seed-scholarships.ts
//
// Seeds the curated fully-funded scholarships — the board's "Scholarships" tab
// previously only had RSS rows (Chevening, WIPO, etc.), which skewed heavily
// to MASTER/PHD. This adds well-known programmes across ALL degree levels,
// including the previously-missing BACHELOR category.
//
// Usage:
//   npx tsx scripts/seed-scholarships.ts
//
// Idempotent: upserts by `guid` (prefixed "curated-scholarship:"), so
// re-running updates entries instead of duplicating them.

import { prisma } from "../lib/prisma";

type Degree = "BACHELOR" | "MASTER" | "PHD" | "ANY";
type Type = "SCHOLARSHIP";

interface Scholarship {
  company: string;
  title: string;
  description: string;
  eligibility: string;
  countries: string; // comma-separated canonical names — drives the country filter
  degree: Degree;
  type?: Type; // defaults to SCHOLARSHIP
  deadline: string | null; // yyyy-mm-dd, or null when annual/rolling (window described in eligibility)
  applyUrl: string;
}

// All programmes below are long-running, well-documented national/
// international scholarships. Application windows are annual and recur each
// year; exact 2027 dates are NOT invented here — deadline is null and the
// typical window is described in the eligibility text instead.
const SCHOLARSHIPS: Scholarship[] = [
  // ---------------------------------------------------------------------------
  // Bachelor-level (the Scholarships tab had ZERO bachelor rows before this).
  // ---------------------------------------------------------------------------
  {
    company: "Stipendium Hungaricum",
    title: "Stipendium Hungaricum Scholarship (Hungary)",
    description:
      "Fully funded Hungarian state scholarship for full-time Bachelor, Master and PhD study at 60+ Hungarian universities in almost any field.",
    eligibility:
      "Citizens of ~80 partner countries (incl. many Asian, African and Middle-Eastern nations); check the official partner-country list. Full tuition waiver, monthly stipend, dormitory place (or contribution), and health insurance. Applications open annually around November for the following autumn intake.",
    countries: "Hungary",
    degree: "ANY",
    deadline: null, // annual window ~Nov–Jan
    applyUrl: "https://stipendiumhungaricum.hu/",
  },
  {
    company: "Türkiye Scholarships",
    title: "Türkiye Scholarships (Turkey)",
    description:
      "Turkey's flagship fully funded scholarship for international students — covers Bachelor, Master and PhD study at Turkish universities, plus a one-year Turkish language course.",
    eligibility:
      "Open to international students of all nationalities (except Turkish citizens and those who lost Turkish citizenship). Full tuition, monthly stipend (undergrad ~4,000+ TL; graduate higher), free accommodation, round-trip flight, and health insurance. Applications open annually around January–February.",
    countries: "Turkey",
    degree: "ANY",
    deadline: null, // annual window ~Jan–Feb
    applyUrl: "https://www.turkiyeburslari.gov.tr/",
  },
  {
    company: "Global Korea Scholarship (GKS)",
    title: "Global Korea Scholarship (South Korea)",
    description:
      "Korea's fully funded government scholarship for international students — separate tracks for Bachelor (GKS-U) and graduate (GKS-G) study at Korean universities.",
    eligibility:
      "International applicants whose parents are not Korean citizens, from GKS partner countries. Full tuition for the degree duration, monthly stipend (~KRW 900,000), round-trip airfare, Korean language training, medical insurance and settlement allowance. Undergraduate applications open annually ~September–October via the Korean Embassy.",
    countries: "South Korea",
    degree: "ANY",
    deadline: null, // annual window ~Sep–Oct
    applyUrl: "https://www.studyinkorea.go.kr/en/sub/gks/allnew_international.do",
  },
  {
    company: "MEXT",
    title: "Japanese Government (MEXT) Scholarship",
    description:
      "Japan's Ministry of Education scholarship — fully funded undergraduate, research (Master/PhD) and other tracks for international students.",
    eligibility:
      "Open to international students via Embassy Recommendation or University Recommendation; age limits vary by track (undergrad: 17–25; research: under 35). Full tuition, monthly stipend (~¥117,000–148,000), round-trip airfare and (for some tracks) accommodation support. Embassy applications typically open April–June.",
    countries: "Japan",
    degree: "ANY",
    deadline: null, // embassy track ~Apr–Jun, annual
    applyUrl: "https://www.studyinjapan.go.jp/en/scholarships/mext.html",
  },
  {
    company: "Chinese Government Scholarship (CSC)",
    title: "Chinese Government Scholarship (China)",
    description:
      "China's fully funded government scholarship for international students — Bachelor, Master and PhD study at 280+ Chinese universities.",
    eligibility:
      "International students worldwide, age limits by level (undergrad: under 25; master: under 35; PhD: under 40). Full or partial tuition, free on-campus accommodation (or stipend), monthly living allowance (undergrad ~2,500 RMB; master ~3,000; PhD ~3,500) and comprehensive medical insurance. Applications open annually ~November–April depending on the university/agency channel.",
    countries: "China",
    degree: "ANY",
    deadline: null, // annual window ~Nov–Apr
    applyUrl: "https://www.campuschina.org/",
  },
  {
    company: "Lester B. Pearson",
    title: "Lester B. Pearson International Scholarship (Canada)",
    description:
      "The University of Toronto's most prestigious scholarship for international undergraduate students — covers tuition, books, incidental fees and full residence support for 4 years.",
    eligibility:
      "International students entering an undergraduate program at U of T, nominated by their high school (one nomination per school). Requires outstanding academic achievement, creativity and leadership. Annual nomination window ~October for the following September intake.",
    countries: "Canada",
    degree: "BACHELOR",
    deadline: null, // annual window ~Oct
    applyUrl: "https://future.utoronto.ca/pearson/",
  },
  {
    company: "KAIST",
    title: "KAIST International Undergraduate Scholarship (South Korea)",
    description:
      "Full and partial scholarships for international undergraduates at Korea's leading science and technology university — tuition, stipend and housing support.",
    eligibility:
      "International applicants to KAIST undergraduate programs in science and engineering. Scholarships are awarded on admission — full tuition plus monthly stipend (KRW 350,000) and on-campus housing for top candidates. Applications open annually ~September for the spring/fall intakes.",
    countries: "South Korea",
    degree: "BACHELOR",
    deadline: null, // annual window ~Sep
    applyUrl: "https://admission.kaist.ac.kr/intl-undergrad/",
  },
  {
    company: "Australia Awards",
    title: "Australia Awards Scholarships",
    description:
      "Australia's fully funded development scholarships for citizens of partner countries — Bachelor, Master and PhD study at Australian institutions.",
    eligibility:
      "Citizens of eligible partner countries (primarily Asia-Pacific, Africa, Middle East); must not be permanent residents of Australia. Full tuition, return airfare, establishment allowance, living allowance (~AUD 30,000/yr), and health insurance. Applications typically open annually ~February–April.",
    countries: "Australia",
    degree: "ANY",
    deadline: null, // annual window ~Feb–Apr
    applyUrl: "https://www.dfat.gov.au/people-to-people/australia-awards",
  },
  {
    company: "Hong Kong Scholarships",
    title: "Hong Kong International Undergraduate Scholarships",
    description:
      "Full-scholarship schemes at Hong Kong's top universities (HKU, HKUST, CUHK, PolyU) for outstanding international undergraduates — full or near-full tuition plus living stipend.",
    eligibility:
      "Outstanding international undergraduate applicants; most universities offer automatic consideration with admission (HKU full scholarships, HKUST entrance scholarships, CUHK full scholarships for top applicants). Competitive academic record required. Annual admissions windows run ~September–January for the autumn intake.",
    countries: "Hong Kong",
    degree: "BACHELOR",
    deadline: null, // rolling admissions windows
    applyUrl: "https://admissions.hku.hk/apply/international-qualifications/scholarships",
  },
  {
    company: "NUS & NTU",
    title: "Singapore University Scholarships (NUS / NTU)",
    description:
      "Full-tuition and living-allowance scholarships for international undergraduates at Singapore's flagship universities — NUS and NTU.",
    eligibility:
      "Outstanding international undergraduate applicants to NUS or NTU; automatic consideration on admission for the Global Merit and President's scholarships at NTU, and NUS's Global Merit/Global Excellence scholarships. Tuition plus monthly living allowance. Applications track the university admissions cycles (~October–March).",
    countries: "Singapore",
    degree: "BACHELOR",
    deadline: null, // admissions-cycle dependent
    applyUrl: "https://www.ntu.edu.sg/admissions/undergraduate/scholarships",
  },
  {
    company: "UCL",
    title: "UCL Global Undergraduate Scholarship (UK)",
    description:
      "UCL's flagship need-based scholarship for international undergraduates — a mix of awards covering full tuition plus maintenance and additional costs, or full tuition only, for the entire degree.",
    eligibility:
      "Overseas fee-paying students from low-income backgrounds (UCL guideline: household income of £42,875 or less) admitted to a full-time undergraduate degree at UCL. Per cycle: 10 awards with full tuition + maintenance + allowance for visa/IHS costs, 20 awards covering full tuition, plus dedicated India awards. Application made alongside the UCL admission application, usually in the spring of the entry year.",
    countries: "United Kingdom",
    degree: "BACHELOR",
    deadline: null, // annual — tied to the UCL admissions cycle
    applyUrl: "https://www.ucl.ac.uk/scholarships/ucl-global-undergraduate-scholarship",
  },
  {
    company: "University of Warwick",
    title: "Warwick Undergraduate Global Excellence Scholarship (UK)",
    description:
      "Scholarship for self-funded international undergraduates at the University of Warwick — award tiers from full tuition to partial fee waivers, covering the full duration of the degree.",
    eligibility:
      "Overseas fee-paying, self-funded students applying for a full-time undergraduate course at Warwick through UCAS who receive an offer. Award tiers include full-fee, half-fee, 25% fee-waiver and £2,000/year awards, spread across the full 3–4 year course. No separate application — considered on admission.",
    countries: "United Kingdom",
    degree: "BACHELOR",
    deadline: null, // automatic with UCAS admission consideration
    applyUrl: "https://warwick.ac.uk/study/scholarships-and-bursaries/warwick-global-excellence-scholarship-2026/",
  },
  // ---------------------------------------------------------------------------
  // Master-level.
  // ---------------------------------------------------------------------------
  {
    company: "Erasmus Mundus",
    title: "Erasmus Mundus Joint Masters (Europe)",
    description:
      "Fully funded joint Master's programmes delivered by consortia of European universities — students study at two or more institutions across Europe.",
    eligibility:
      "Open to students of any nationality who hold a Bachelor's degree (or equivalent). Full scholarships cover tuition, travel, installation costs and a monthly living allowance (~€1,400). Each programme has its own annual application window, typically ~October–February.",
    countries: "Europe",
    degree: "MASTER",
    deadline: null, // per-program windows ~Oct–Feb
    applyUrl: "https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en",
  },
  {
    company: "DAAD EPOS",
    title: "DAAD EPOS — Development-Related Postgraduate Courses (Germany)",
    description:
      "Fully funded Master's courses in Germany for students from developing countries — development-related postgraduate programmes (EPOS) at German universities.",
    eligibility:
      "Graduates (Bachelor's, usually 2+ years of relevant work experience) from developing countries in fields like engineering, economics, agriculture, public health and planning. Full or partial tuition (most EPOS programmes are tuition-free), monthly stipend (~€934), health insurance and travel allowance. Applications ~June–October for the following year.",
    countries: "Germany",
    degree: "MASTER",
    deadline: null, // annual window ~Jun–Oct
    applyUrl: "https://www.daad.de/en/study-and-research-in-germany/scholarships/epos/",
  },
  {
    company: "Eiffel Excellence",
    title: "Eiffel Excellence Scholarship (France)",
    description:
      "France's flagship scholarship for international students — funds Master's (12–36 months) and PhD (12 months) study at French institutions.",
    eligibility:
      "International students aged 25 or under (Master's) applying to French higher-education institutions; fields prioritized: science/engineering, economics, law and political science. Monthly allowance (€1,031 Master's / €1,700 PhD) plus travel, health cover and some housing support. Annual window ~September–January (institutions nominate).",
    countries: "France",
    degree: "MASTER",
    deadline: null, // annual window ~Sep–Jan
    applyUrl: "https://www.campusfrance.org/en/eiffel",
  },
  {
    company: "Schwarzman Scholars",
    title: "Schwarzman Scholars (Tsinghua, China)",
    description:
      "A fully funded one-year Master's in Global Affairs at Tsinghua University, Beijing — leadership program for outstanding young people worldwide.",
    eligibility:
      "Applicants aged 18–28 holding an undergraduate degree; strong leadership and academic record required. Full funding: tuition, room and board, travel to/from Beijing, an in-country study tour, books and a personal stipend. Applications open annually ~April for the following August intake.",
    countries: "China",
    degree: "MASTER",
    deadline: null, // annual window ~Apr–Sep
    applyUrl: "https://www.schwarzmanscholars.org/",
  },
  {
    company: "JJ/WBGSP",
    title: "Joint Japan / World Bank Graduate Scholarship",
    description:
      "Fully funded Master's scholarships for students from developing countries to study development-related fields at partner universities worldwide.",
    eligibility:
      "Citizens of World Bank member developing countries, with a Bachelor's degree and 3+ years of relevant development work experience. Covers full tuition, monthly living stipend, round-trip airfare and health insurance. Annual application window ~February–May.",
    countries: "Global",
    degree: "MASTER",
    deadline: null, // annual window ~Feb–May
    applyUrl: "https://www.worldbank.org/en/partnerships/brief/joint-japan-world-bank-graduate-scholarship-program",
  },
  // ---------------------------------------------------------------------------
  // PhD-level.
  // ---------------------------------------------------------------------------
  {
    company: "Gates Cambridge",
    title: "Gates Cambridge Scholarship (UK)",
    description:
      "One of the most prestigious international scholarships — fully funds graduate study (mainly PhD) at the University of Cambridge.",
    eligibility:
      "Open to citizens of any country outside the UK, admitted to a full-time postgraduate degree at Cambridge (PhD, Master's, or second Bachelor's). Covers the full cost of study (tuition, college fees, maintenance ~£21,000+/yr) plus a discretionary family allowance. Annual application windows ~October–January (course-specific).",
    countries: "United Kingdom",
    degree: "PHD",
    deadline: null, // annual window ~Oct–Jan
    applyUrl: "https://www.gatescambridge.org/",
  },
  {
    company: "Rhodes Scholarship",
    title: "Rhodes Scholarship (Oxford, UK)",
    description:
      "The world's oldest graduate scholarship — fully funds postgraduate study (Master's or DPhil) at the University of Oxford.",
    eligibility:
      "Open to citizens of Rhodes-eligible countries/regions (constituencies worldwide), typically aged 18–24 (with exceptions up to 28). Covers all Oxford fees, a personal stipend (~£19,000+/yr), one economy flight to and from Oxford, and a settling allowance. Applications run ~June–October depending on constituency.",
    countries: "United Kingdom",
    degree: "PHD",
    deadline: null, // constituency-dependent ~Jun–Oct
    applyUrl: "https://rhodeshouse.ox.ac.uk/",
  },
  {
    company: "Vanier CGS",
    title: "Vanier Canada Graduate Scholarship",
    description:
      "Canada's flagship doctoral scholarship — $50,000 per year for three years for world-class PhD students at Canadian universities.",
    eligibility:
      "International and Canadian PhD students nominated by their Canadian university; leadership and research excellence required. Annual nomination window ~July–September (university-nominated) for the following year.",
    countries: "Canada",
    degree: "PHD",
    deadline: null, // annual window ~Jul–Sep
    applyUrl: "https://vanier.gc.ca/",
  },
  {
    company: "Knight-Hennessy",
    title: "Stanford Knight-Hennessy Scholars (US)",
    description:
      "Fully funds graduate study (PhD, Master's, professional degrees) at Stanford University — the largest fully endowed graduate fellowship in the world.",
    eligibility:
      "Applicants from any country, admitted to a Stanford graduate degree program; leadership and multidisciplinary mindset required. Covers tuition, fees, living stipend, a travel allowance and academic enrichment funding for up to 3 years. Application window ~June–December (joint with Stanford program deadlines).",
    countries: "United States",
    degree: "PHD",
    deadline: null, // annual window ~Jun–Dec
    applyUrl: "https://knight-hennessy.stanford.edu/",
  },
  {
    company: "SINGA",
    title: "Singapore International Graduate Award (SINGA)",
    description:
      "Fully funded PhD scholarship at Singapore's top research universities — NTU, NUS, SUTD and the A*STAR research institutes.",
    eligibility:
      "Open to international graduates with a strong Bachelor's or Master's in science/engineering. Covers tuition, monthly stipend (~SGD 2,700–3,200) and a one-time settling allowance; renewable annually. Applications open twice yearly (~June and December intakes, rolling review).",
    countries: "Singapore",
    degree: "PHD",
    deadline: null, // rolling — two intakes per year
    applyUrl: "https://www.a-star.edu.sg/Scholarships/for-graduate-studies/singapore-international-graduate-award-singa",
  },
];

async function main() {
  let created = 0;
  let updated = 0;

  for (const s of SCHOLARSHIPS) {
    const guid = `curated-scholarship:${s.company.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const data = {
      company: s.company,
      title: s.title,
      description: s.description,
      eligibility: s.eligibility,
      countries: s.countries,
      degree: s.degree,
      type: s.type ?? ("SCHOLARSHIP" as Type),
      deadline: s.deadline ? new Date(`${s.deadline}T12:00:00`) : null,
      applyUrl: s.applyUrl,
      sourceFeed: "Curated scholarships",
      publishedAt: new Date(),
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

  await prisma.$disconnect();
  console.log(`Scholarships ready — created ${created}, updated ${updated}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
