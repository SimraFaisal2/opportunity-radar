// scripts/seed-research-programs.ts
//
// Seeds the curated research internship programmes (the ones the board shows
// under the purple "Research" filter) that don't come from an RSS feed.
// Each entry carries: host country/region, eligibility requirements, the next
// application deadline (for the upcoming summer cohort), and the official
// application URL.
//
// Usage:
//   npx tsx scripts/seed-research-programs.ts
//
// Idempotent: upserts by `guid` (prefixed "curated:"), so re-running updates
// entries instead of duplicating them.

import { prisma } from "../lib/prisma";

type Degree = "BACHELOR" | "MASTER" | "PHD" | "ANY";
type Type = "RESEARCH_INTERNSHIP" | "INTERNSHIP";

interface Program {
  company: string;
  title: string;
  description: string;
  eligibility: string;
  countries: string; // comma-separated — drives the country filter
  degree: Degree;
  type?: Type; // defaults to RESEARCH_INTERNSHIP
  deadline: string | null; // yyyy-mm-dd, or null when the programme is paused / rolling
  applyUrl: string;
}

// Deadlines are the next application-close dates for the summer 2027 cohort
// (Mitacs closes this September; most European programmes close Nov–Feb).
// Each was verified against the official programme page in Aug 2026:
//   ISTernship  — program officially PAUSED; 2027 cycle announced late 2026
//   EPFL        — Nov 15, 2026
//   RWTH Aachen — Jan 10, 2027
//   Vienna BC   — Jan 11, 2027
//   CERN        — late Jan 2027 (Jan 26 for prior cycle)
//   INSAIT SURF — early Mar (Mar 8 for prior cycle)
//   Amgen EU    — Feb 1, 2027
//   Crick       — early Feb (Feb 4 for prior cycle)
//   John Innes  — mid-Jan (Jan 16 for prior cycle)
//   ETH CS      — Dec 16, 2026
//   Oxford UNIQ+ — mid-Feb (Feb 18 for prior cycle)
//   HZDR        — late Feb (Feb 22 for prior cycle)
//   EMBL        — rolling / quarterly, no fixed summer deadline
const PROGRAMS: Program[] = [
  {
    company: "EPFL",
    title: "EPFL Summer Research Program (Life Sciences / Engineering)",
    description:
      "8-week paid research placement in an EPFL Life Sciences lab (biology, biophysics, chemistry, bioengineering, bioinformatics).",
    eligibility:
      "Bachelor's or 1st-year Master's students worldwide who will have completed at least 2 years of undergraduate study by the start of the internship. Excellent academic record required (highly competitive).",
    countries: "Switzerland",
    degree: "ANY", // accepts Bachelor's and 1st-year Master's
    deadline: "2026-11-15",
    applyUrl: "https://www.epfl.ch/schools/sv/education/summer-research-program/",
  },
  {
    company: "RWTH Aachen",
    title: "RWTH Aachen UROP International",
    description:
      "10-week research internship across 100+ projects in engineering, natural sciences, computer science and humanities at RWTH Aachen University.",
    eligibility:
      "Undergraduates from North American universities (sophomores/juniors ideal; freshmen and seniors welcome). Minimum GPA 3.2 or equivalent (70%). No German required. ~30 students receive a €2,000 scholarship.",
    countries: "Germany",
    degree: "BACHELOR",
    deadline: "2027-01-10",
    applyUrl: "https://www.rwth-aachen.de/cms/root/studium/im-studium/angebote-fuer-studierende/urop/urop-international/",
  },
  {
    company: "Vienna BioCenter",
    title: "Vienna BioCenter Summer School",
    description:
      "9-week fully funded summer school in molecular biology, cell biology, genetics and chemistry across Vienna BioCenter's research institutes.",
    eligibility:
      "Undergraduates or Master's students worldwide who have completed at least 2 years of university study by June 30. Life sciences only (no veterinary medicine, medical engineering, agriculture, pharmacy). Strong record + ~3 months prior research experience recommended.",
    countries: "Austria",
    degree: "ANY", // accepts Bachelor's and Master's students
    deadline: "2027-01-11",
    applyUrl: "https://training.vbc.ac.at/how-to-apply/",
  },
  {
    company: "ISTA Austria",
    title: "ISTernship Summer Program (ISTA Austria)",
    description:
      "2–3 month paid research internship at the Institute of Science and Technology Austria in biology, CS, data science, maths, physics, neuroscience, chemistry & materials.",
    eligibility:
      "NOTE: The ISTernship is currently PAUSED — the official site says the 2027 application cycle will be announced in late 2026. When it reopens: Bachelor's or Master's students (or graduates within 1 year) with at least 2 years / 4 semesters of bachelor's study. PhD students ineligible. Fully funded (~€1,150/month + housing + travel).",
    countries: "Austria",
    degree: "ANY", // accepts Bachelor's and Master's students
    deadline: null, // program paused — no announced 2027 deadline yet
    applyUrl: "https://phd.pages.ista.ac.at/internships/",
  },
  {
    company: "INSAIT",
    title: "INSAIT SURF (Computer Science & AI)",
    description:
      "Summer Undergraduate Research Fellowship at INSAIT — Bulgaria's Institute for Computer Science, AI and Technology — working on top-tier CS/AI research.",
    eligibility:
      "Strong undergraduate students (typically 2nd year+) in computer science, AI, or closely related fields with excellent academic standing; research experience a plus. Competitive selection; stipend provided.",
    countries: "Bulgaria",
    degree: "BACHELOR",
    deadline: "2027-03-08", // early March (Mar 8 for the prior cycle)
    applyUrl: "https://insait.ai/surf/",
  },
  {
    company: "CERN",
    title: "CERN Summer Student Programme",
    description:
      "8–13 week placement in physics, engineering or computing at CERN in Geneva — particle physics, detectors, accelerators and beyond.",
    eligibility:
      "Bachelor's or Master's students who have completed at least 3 years of full-time university study. Nationals of CERN Member/Associate Member States (a few additional states allowed). Physics, engineering, computing, mathematics. Paid stipend.",
    countries: "Switzerland",
    degree: "ANY", // accepts Bachelor's and Master's students
    deadline: "2027-01-26",
    applyUrl: "https://careers.cern/summer",
  },
  {
    company: "Amgen Scholars Europe",
    title: "Amgen Scholars Europe",
    description:
      "8–10 week fully funded research programme at top European host universities: LMU Munich, ETH Zurich, Institut Pasteur, University of Cambridge, Karolinska, EPFL, University of Copenhagen.",
    eligibility:
      "Undergraduates enrolled at a European university who have completed at least 2 years of study (some hosts accept US students). Fully funded — stipend, travel and housing.",
    countries: "Switzerland,Germany,France,United Kingdom,Sweden,Denmark",
    degree: "BACHELOR",
    deadline: "2027-02-01",
    applyUrl: "https://amgenscholars.com/europe-program/",
  },
  {
    company: "Francis Crick Institute",
    title: "Francis Crick Institute Summer Studentship",
    description:
      "4–8 week lab placement at the Francis Crick Institute, London's flagship biomedical research institute.",
    eligibility:
      "Open to current university students (typically UK-based) — check the Crick's eligibility rules each cycle; priority often given to students in their 1st–3rd year of a biomedical degree. Paid stipend.",
    countries: "United Kingdom",
    degree: "BACHELOR",
    deadline: "2027-02-04", // first Wednesday of February (Feb 4 for the prior cycle)
    applyUrl: "https://www.crick.ac.uk/careers-study/study-with-us/summer-studentships",
  },
  {
    company: "John Innes Centre",
    title: "John Innes Centre International Summer School",
    description:
      "6-week paid international summer school in plant and microbial science at the John Innes Centre, Norwich, UK.",
    eligibility:
      "Open to international (non-UK) undergraduate students — typically 2nd or 3rd year — studying biology, biochemistry, plant science or microbiology. Paid stipend + accommodation.",
    countries: "United Kingdom",
    degree: "BACHELOR",
    deadline: "2027-01-16", // mid-January (Jan 16 for the prior cycle)
    applyUrl: "https://www.jic.ac.uk/international-summer-school/",
  },
  {
    company: "ETH Zurich (CS)",
    title: "ETH Zurich Student Summer Research Fellowship (Computer Science)",
    description:
      "8-week summer research fellowship in the Department of Computer Science at ETH Zurich — machine learning, systems, theory and more.",
    eligibility:
      "Bachelor's or Master's students in computer science or a closely related field, typically with at least 2 years of study completed. Stipend provided for the 8-week placement.",
    countries: "Switzerland",
    degree: "ANY", // accepts Bachelor's and Master's students
    deadline: "2026-12-16", // applications open Nov 1, close Dec 16, 2026
    applyUrl: "https://inf.ethz.ch/studies/summer-research-fellowship.html",
  },
  {
    company: "University of Oxford",
    title: "Oxford UNIQ+ Research Internships",
    description:
      "6-week fully funded research internship at the University of Oxford across arts, humanities, social sciences, maths, physical and life sciences.",
    eligibility:
      "UK-domiciled undergraduates in their 1st or 2nd year (some programmes accept 3rd year), typically from state schools or under-represented backgrounds. Full funding — stipend + accommodation.",
    countries: "UK",
    degree: "BACHELOR",
    deadline: "2027-02-18", // mid-February (Feb 18 for the prior cycle)
    applyUrl: "https://www.uniq.ox.ac.uk/uniq-plus-research-internships",
  },
  {
    company: "HZDR",
    title: "HZDR Summer Student Program (Physics/Chemistry)",
    description:
      "6–8 week summer placement at Helmholtz-Zentrum Dresden-Rossendorf in physics, chemistry, materials and engineering.",
    eligibility:
      "Bachelor's or Master's students in physics, chemistry, materials science or related engineering fields with at least 2 years of study. Stipend + travel allowance provided.",
    countries: "Germany",
    degree: "ANY", // accepts Bachelor's and Master's students
    deadline: "2027-02-22", // late February (Feb 22 for the prior cycle)
    applyUrl: "https://www.hzdr.de/summer",
  },
  {
    company: "EMBL",
    title: "EMBL Summer First-Step Fellowship",
    description:
      "Paid summer fellowship at the European Molecular Biology Laboratory — sites in Heidelberg, Grenoble, Hamburg, Rome, Barcelona and Hinxton.",
    eligibility:
      "University students in molecular biology, chemistry, physics, computer science, mathematics or engineering who have completed at least 1–2 years of study. Living allowance + travel support. Rolling / quarterly review (Mar 31, Jun 30, Sep 30, Dec 31) — no single summer deadline.",
    countries: "Germany,France,United Kingdom,Italy,Spain",
    degree: "ANY", // accepts university students across degrees
    deadline: null, // rolling — apply directly to a group leader
    applyUrl: "https://www.embl.org/jobs/summer-fellowships/",
  },
  {
    company: "INRS",
    title: "INRS Undergraduate Summer Research Internships",
    description:
      "8–12 week summer research internship across INRS's centres in Quebec — natural sciences, engineering, health and social sciences.",
    eligibility:
      "Open to students from Quebec, Canada and abroad who have completed at least one year of undergraduate study in sciences/engineering/health/social sciences, with a cumulative GPA of B- or equivalent. $4,000 admission scholarship if you later join an INRS Master's.",
    countries: "Canada",
    degree: "BACHELOR",
    deadline: "2027-02-01",
    applyUrl: "https://inrs.ca/en/studies/research-internships/undergraduate-summer-research-internships/",
  },
  {
    company: "Amgen Scholars (US)",
    title: "Amgen Scholars Program (US)",
    description:
      "8–10 week fully funded research programme at US host campuses — MIT, Stanford, Caltech, Harvard, Berkeley, UCLA, UCSF, NIH, etc.",
    eligibility:
      "US citizens or permanent residents enrolled at a US college/university, minimum GPA 3.2, with interest in a PhD or MD/PhD in biotech/life sciences. Fully funded — stipend (~$4,300+), housing, travel.",
    countries: "United States",
    degree: "BACHELOR",
    deadline: "2027-02-01",
    applyUrl: "https://amgenscholars.com/us-program/",
  },
  {
    company: "Polytechnique Montréal",
    title: "Polytechnique Montréal Summer Research Internship (USRA)",
    description:
      "16-week paid research internship (35h/week, $19.26/h + $2,700 living allowance) at Polytechnique Montréal, Quebec.",
    eligibility:
      "Full-time STEM undergraduates in 3rd or 4th year with minimum GPA 2.75/4.0. Open to Canadian citizens, permanent residents and international students with a valid study permit. $3,000 scholarship if you later enrol at Polytechnique.",
    countries: "Canada",
    degree: "BACHELOR",
    deadline: "2027-01-17",
    applyUrl: "https://www.polymtl.ca/futur/en/es/research/internships/awards",
  },
  {
    company: "Mitacs",
    title: "Mitacs Globalink Research Internship",
    description:
      "12-week paid research internship at a Canadian university — round-trip airfare, stipend, housing and emergency health insurance covered.",
    eligibility:
      "International undergrads from Mitacs partner countries (incl. US via Fulbright) who have completed at least 2 years of study, with 1–3 semesters remaining. Country-specific GPA requirements. Deadline is in September for the following summer.",
    countries: "Canada",
    degree: "BACHELOR",
    deadline: "2026-09-16",
    applyUrl: "https://www.mitacs.ca/our-programs/globalink-research-internship-students/",
  },
  // ---------------------------------------------------------------------------
  // More European programmes — added Aug 2026, verified against official pages.
  // ---------------------------------------------------------------------------
  {
    company: "DAAD RISE",
    title: "DAAD RISE Germany Research Internships",
    description:
      "8–12 week research internship in the natural sciences, engineering or computer science at a German university or research institute, funded by DAAD with a monthly stipend.",
    eligibility:
      "Undergraduates (typically 2nd–4th year) from North America, the UK and Ireland studying biology, chemistry, physics, earth sciences, engineering or computer science. Applicants rank up to 7 projects; German language not required. Stipend ~€1,200/month.",
    countries: "Germany",
    degree: "BACHELOR",
    deadline: "2026-11-30",
    applyUrl: "https://www.daad.de/rise/en/rise-germany/",
  },
  {
    company: "DESY",
    title: "DESY Summer Student Programme",
    description:
      "Summer placement at Deutsches Elektronen-Synchrotron (DESY) in Hamburg — particle physics, photon science, accelerator physics and computing at one of Europe's leading research centres.",
    eligibility:
      "Bachelor's or Master's students in physics, engineering or related fields who have completed at least 2 years of university study. International applicants welcome. Stipend and accommodation provided.",
    countries: "Germany",
    degree: "ANY",
    deadline: "2027-01-31",
    applyUrl: "https://summerstudents.desy.de/",
  },
  {
    company: "EuroScholars",
    title: "EuroScholars Undergraduate Research Abroad",
    description:
      "One-semester (or summer) research immersion at a European research university — Leiden, Amsterdam, Edinburgh, UCL, Tübingen, Heidelberg, Karolinska, etc. — earning credits while embedded in a research group.",
    eligibility:
      "Undergraduates with strong academic standing (GPA 3.0+) from US/Canadian universities; open to most fields. Participants pay host-university tuition; need-based grants available.",
    countries: "Netherlands,United Kingdom,Germany,Sweden",
    degree: "BACHELOR",
    deadline: null, // rolling — multiple intakes per year
    applyUrl: "https://www.euroscholars.eu/",
  },
  {
    company: "SISSA",
    title: "SISSA Summer Research (Physics, Maths, CS)",
    description:
      "Summer research placements at the International School for Advanced Studies (SISSA) in Trieste — theoretical physics, mathematics, neuroscience and data science.",
    eligibility:
      "Strong undergraduate or Master's students in physics, mathematics, neuroscience or computer science. Typically requires a competitive academic record.",
    countries: "Italy",
    degree: "ANY",
    deadline: null, // rolling — direct contact with research groups
    applyUrl: "https://www.sissa.it/education",
  },
  {
    company: "ICTP",
    title: "ICTP Summer Research & Internships (Trieste)",
    description:
      "Research opportunities at the Abdus Salam International Centre for Theoretical Physics (ICTP) in Trieste — physics, mathematics, climate and applied sciences.",
    eligibility:
      "Bachelor's or Master's students in physics/mathematics with strong backgrounds; ICTP programmes prioritise applicants from developing countries.",
    countries: "Italy",
    degree: "ANY",
    deadline: null, // rolling
    applyUrl: "https://www.ictp.it/education",
  },
  {
    company: "IMDEA",
    title: "IMDEA Summer Research Internships (Madrid)",
    description:
      "Summer research internships across IMDEA's Madrid institutes — software, networks, materials, energy, water, food and nanoscience.",
    eligibility:
      "Undergraduates (2nd year+) in computer science, engineering or science fields. Interns join ongoing research projects with a stipend.",
    countries: "Spain",
    degree: "BACHELOR",
    deadline: null, // rolling
    applyUrl: "https://software.imdea.org/",
  },
  {
    company: "Institut Curie",
    title: "Institut Curie Summer Research Internships (Paris)",
    description:
      "Summer internships in cancer biology, biophysics and chemistry at Institut Curie — one of France's premier biomedical research institutes.",
    eligibility:
      "Undergraduate or Master's students in biology, chemistry, biophysics or related fields; international students welcome. Interns receive a stipend.",
    countries: "France",
    degree: "ANY",
    deadline: null, // rolling
    applyUrl: "https://science.institut-curie.org/",
  },
  {
    company: "Inria",
    title: "Inria Research Internships (France)",
    description:
      "Research internships in computer science, AI, robotics, maths and software systems across Inria's French research centres.",
    eligibility:
      "Strong Master's students (or exceptional undergraduates) in computer science, mathematics or related fields. Many positions are paid.",
    countries: "France",
    degree: "MASTER",
    deadline: null, // rolling
    applyUrl: "https://www.inria.fr/en/recruitment-join-us",
  },
  {
    company: "CEA",
    title: "CEA Summer Internships (France)",
    description:
      "Paid research internships at the French Alternative Energies and Atomic Energy Commission — physics, energy, materials, life sciences and computing.",
    eligibility:
      "Undergraduate and Master's students in STEM fields; international applications depend on the hosting laboratory. Stipend provided.",
    countries: "France",
    degree: "ANY",
    deadline: null, // rolling
    applyUrl: "https://www.cea.fr/english/Pages/Jobs-and-careers.aspx",
  },
  {
    company: "Politecnico di Milano",
    title: "Politecnico di Milano Summer Research & Schools",
    description:
      "Summer research placements and international summer schools in engineering, design and architecture at Politecnico di Milano.",
    eligibility:
      "Undergraduate or Master's students in engineering, design or architecture; international students welcome. Some programmes are funded.",
    countries: "Italy",
    degree: "ANY",
    deadline: null, // rolling
    applyUrl: "https://www.polimi.it/en/international-prospective-students",
  },
  // ---------------------------------------------------------------------------
  // European corporate internships — the board's Internships tab was thin on
  // European-based employers; these are always-open rolling programmes.
  // ---------------------------------------------------------------------------
  {
    company: "Spotify",
    title: "Spotify Internship Programme (Stockholm)",
    description:
      "Internships across engineering, data, design, product and marketing at Spotify's Stockholm HQ and other European offices.",
    eligibility:
      "Currently enrolled students or recent graduates; roles span bachelor's to master's level. Rolling applications throughout the year.",
    countries: "Sweden",
    degree: "ANY",
    type: "INTERNSHIP",
    deadline: null,
    applyUrl: "https://www.lifeatspotify.com/jobs",
  },
  {
    company: "SAP",
    title: "SAP Internship & Working Student Programme (Germany)",
    description:
      "Internships and working-student roles in software engineering, AI, consulting and business across SAP's German sites (Walldorf, Berlin, Munich).",
    eligibility:
      "Students enrolled at a university (bachelor's or master's) — working-student roles suit those studying in Germany; full internships welcome international applicants.",
    countries: "Germany",
    degree: "ANY",
    type: "INTERNSHIP",
    deadline: null,
    applyUrl: "https://jobs.sap.com/",
  },
  {
    company: "ASML",
    title: "ASML Internship Programme (Netherlands)",
    description:
      "Internships in engineering, physics, software and supply chain at ASML — the world's leading semiconductor lithography company — in Veldhoven, Netherlands.",
    eligibility:
      "Bachelor's or Master's students in engineering, physics, computer science or related fields; most roles require enrolment at a university.",
    countries: "Netherlands",
    degree: "ANY",
    type: "INTERNSHIP",
    deadline: null,
    applyUrl: "https://www.asml.com/en/careers",
  },
  {
    company: "Booking.com",
    title: "Booking.com Internships (Amsterdam)",
    description:
      "Internships in software engineering, data science, product and business at Booking.com's Amsterdam headquarters.",
    eligibility:
      "Students and recent graduates; engineering and data roles typically require relevant coursework or projects.",
    countries: "Netherlands",
    degree: "ANY",
    type: "INTERNSHIP",
    deadline: null,
    applyUrl: "https://careers.booking.com/",
  },
  {
    company: "Adyen",
    title: "Adyen Internships (Amsterdam)",
    description:
      "Internships in engineering, data, product and finance at Adyen, the Amsterdam-based fintech payments platform.",
    eligibility:
      "Currently enrolled students or recent graduates with relevant skills; most roles are in Amsterdam.",
    countries: "Netherlands",
    degree: "ANY",
    type: "INTERNSHIP",
    deadline: null,
    applyUrl: "https://careers.adyen.com/",
  },
  {
    company: "Philips",
    title: "Philips Internship Programme (Netherlands)",
    description:
      "Internships in engineering, health technology, software and business at Philips across Eindhoven, Amsterdam and other European sites.",
    eligibility:
      "Bachelor's or Master's students enrolled at a university; international students need an EU study/work arrangement.",
    countries: "Netherlands",
    degree: "ANY",
    type: "INTERNSHIP",
    deadline: null,
    applyUrl: "https://www.careers.philips.com/",
  },
  {
    company: "Siemens",
    title: "Siemens Internship & Working Student Programme",
    description:
      "Internships and working-student roles in engineering, software, AI, energy and business across Siemens in Germany (Munich, Berlin, Erlangen) and Europe.",
    eligibility:
      "University students (bachelor's or master's) in engineering, computer science or business; many roles are in Germany.",
    countries: "Germany",
    degree: "ANY",
    type: "INTERNSHIP",
    deadline: null,
    applyUrl: "https://jobs.siemens.com/",
  },
  {
    company: "Bosch",
    title: "Bosch Internship & Working Student Programme",
    description:
      "Internships in engineering, software, mobility and business at Bosch's German sites (Stuttgart, Munich, Dresden) and European offices.",
    eligibility:
      "Students enrolled at a university; working-student roles suit those studying in Germany, full internships welcome broader applicants.",
    countries: "Germany",
    degree: "ANY",
    type: "INTERNSHIP",
    deadline: null,
    applyUrl: "https://www.bosch-career.com/",
  },
  {
    company: "Airbus",
    title: "Airbus Internship Programme (Europe)",
    description:
      "Internships in aerospace engineering, software, data and business across Airbus sites in France, Germany, Spain and the UK.",
    eligibility:
      "Bachelor's or Master's students in engineering, computer science or business; EU work authorisation often required.",
    countries: "France,Germany,Spain,United Kingdom",
    degree: "ANY",
    type: "INTERNSHIP",
    deadline: null,
    applyUrl: "https://www.airbus.com/en/careers",
  },
  {
    company: "Volvo Group",
    title: "Volvo Group Internships (Sweden)",
    description:
      "Internships in engineering, software, electromobility, data and business at Volvo Group in Gothenburg and across Sweden.",
    eligibility:
      "Bachelor's or Master's students in engineering, computer science or business; many roles are based in Gothenburg.",
    countries: "Sweden",
    degree: "ANY",
    type: "INTERNSHIP",
    deadline: null,
    applyUrl: "https://www.volvogroup.com/en/careers.html",
  },
  {
    company: "Ericsson",
    title: "Ericsson Internship Programme (Sweden)",
    description:
      "Internships in telecommunications, software, AI and business at Ericsson in Stockholm and Kista, Sweden.",
    eligibility:
      "Students and recent graduates in engineering, computer science or business; many roles are in Stockholm.",
    countries: "Sweden",
    degree: "ANY",
    type: "INTERNSHIP",
    deadline: null,
    applyUrl: "https://www.ericsson.com/en/careers",
  },
  {
    company: "Nokia",
    title: "Nokia Internship Programme (Finland)",
    description:
      "Internships in networking, software, 5G, AI and business at Nokia in Espoo and Oulu, Finland, plus European sites.",
    eligibility:
      "Bachelor's or Master's students in engineering, computer science or business; international students need Finnish study arrangements.",
    countries: "Finland",
    degree: "ANY",
    type: "INTERNSHIP",
    deadline: null,
    applyUrl: "https://www.nokia.com/careers/",
  },
  {
    company: "Zalando",
    title: "Zalando Internships (Berlin)",
    description:
      "Internships in software engineering, data, product, design and business at Zalando, Europe's leading fashion platform, in Berlin.",
    eligibility:
      "Students and recent graduates; engineering and data roles require relevant skills. Berlin-based roles.",
    countries: "Germany",
    degree: "ANY",
    type: "INTERNSHIP",
    deadline: null,
    applyUrl: "https://jobs.zalando.com/",
  },
  {
    company: "Klarna",
    title: "Klarna Internships (Stockholm)",
    description:
      "Internships in engineering, data, product and business at Klarna, the Stockholm-based fintech.",
    eligibility:
      "Students and recent graduates in computer science, data or business; most roles are in Stockholm.",
    countries: "Sweden",
    degree: "ANY",
    type: "INTERNSHIP",
    deadline: null,
    applyUrl: "https://www.klarna.com/careers/",
  },
  {
    company: "Revolut",
    title: "Revolut Internships (London & Europe)",
    description:
      "Internships and graduate roles in engineering, data, product, design and operations at Revolut across London, Lisbon, Madrid, Kraków and other European hubs.",
    eligibility:
      "Students and recent graduates with strong technical or analytical skills; global programme with European hubs.",
    countries: "United Kingdom,Portugal,Spain,Poland",
    degree: "ANY",
    type: "INTERNSHIP",
    deadline: null,
    applyUrl: "https://www.revolut.com/careers/",
  },
  {
    company: "Wise",
    title: "Wise Internships (London)",
    description:
      "Internships in engineering, data, product, design and finance at Wise, the London-based international money-transfer company.",
    eligibility:
      "Students and recent graduates; engineering and data roles require relevant experience or coursework.",
    countries: "United Kingdom",
    degree: "ANY",
    type: "INTERNSHIP",
    deadline: null,
    applyUrl: "https://wise.jobs/",
  },
  {
    company: "Bolt",
    title: "Bolt Internships (Tallinn)",
    description:
      "Internships in software engineering, data, product and operations at Bolt, the Estonian mobility and delivery platform.",
    eligibility:
      "Students and recent graduates in computer science, data or business; many roles are in Tallinn.",
    countries: "Estonia",
    degree: "ANY",
    type: "INTERNSHIP",
    deadline: null,
    applyUrl: "https://bolt.eu/careers/",
  },
  // ---------------------------------------------------------------------------
  // Fully funded research internships — worldwide, beyond the European core.
  // All verified against official pages in Aug 2026; stipend + travel + housing
  // coverage noted in eligibility. Deadlines are the next application-close
  // dates for the summer 2027 cohort.
  // ---------------------------------------------------------------------------
  {
    company: "Caltech SURF",
    title: "Caltech SURF (Summer Undergraduate Research Fellowships)",
    description:
      "10-week fully funded research fellowship at Caltech and JPL — physics, chemistry, biology, engineering, computer science, planetary science and more.",
    eligibility:
      "Continuing undergraduates worldwide (min. 2.0 GPA) in any field. Fully funded — $8,110 stipend for 10 weeks, with housing and travel support depending on the fellowship.",
    countries: "United States",
    degree: "BACHELOR",
    deadline: "2027-03-01",
    applyUrl: "https://sfp.caltech.edu/undergraduate-research/programs/surf",
  },
  {
    company: "OIST",
    title: "OIST Research Internship Program (Japan)",
    description:
      "2–6 month research internship at Okinawa Institute of Science and Technology — biology, physics, chemistry, neuroscience, maths, CS and more.",
    eligibility:
      "Undergraduates in their final 2 years, Master's students or recent graduates of any nationality. Fully funded — ¥2,400/day allowance, round-trip airfare, furnished housing, commuting support.",
    countries: "Japan",
    degree: "ANY",
    deadline: "2026-10-15",
    applyUrl: "https://www.oist.jp/admissions/research-internship/apply-research-internship",
  },
  {
    company: "NUS IRIS",
    title: "NUS IRIS — Internship & Research Immersion (Singapore)",
    description:
      "Research internship at the National University of Singapore — engineering, computing, science and design across NUS's faculties.",
    eligibility:
      "Outstanding 3rd/4th-year undergraduates and Master's students worldwide. Fully funded — monthly stipend, free on-campus housing, airfare and visa support.",
    countries: "Singapore",
    degree: "ANY",
    deadline: "2027-01-15",
    applyUrl: "https://cde.nus.edu.sg/graduate/iris-nus/",
  },
  {
    company: "KAIST-X",
    title: "KAIST-X Summer Research Internship (South Korea)",
    description:
      "Summer research internship at KAIST — science, engineering, computing and AI with Korean and international faculty.",
    eligibility:
      "Overseas undergraduates (typically 3rd/4th year) in STEM of any nationality. Fully funded — living stipend, on-campus housing, travel and insurance support.",
    countries: "South Korea",
    degree: "BACHELOR",
    deadline: "2027-01-31",
    applyUrl: "https://summer.kaist.ac.kr/",
  },
  {
    company: "KAUST VSRP",
    title: "KAUST Visiting Student Research Program (VSRP)",
    description:
      "2–6 month research internship at King Abdullah University of Science and Technology across 17 STEM degree programs with 100+ faculty projects.",
    eligibility:
      "3rd/4th-year bachelor's and Master's students in STEM, min. GPA 3.5/4.0. Fully funded — $1,000/month stipend, private housing, round-trip airfare, health insurance. Rolling — apply year-round.",
    countries: "Saudi Arabia",
    degree: "ANY",
    deadline: null, // rolling — year-round intakes
    applyUrl: "https://admissions.kaust.edu.sa/study/internships",
  },
  {
    company: "Weizmann Institute",
    title: "Weizmann Kupcinet-Getz International Summer Science School",
    description:
      "8-week fully funded summer science school at the Weizmann Institute of Science, Israel — life sciences, chemistry, physics, mathematics and computer science.",
    eligibility:
      "Undergraduates (after 1st year), Master's students and recent bachelor's graduates worldwide (no PhD students). Fully funded — $1,100 stipend, travel subsidy up to $400, free accommodation, insurance.",
    countries: "Israel",
    degree: "ANY",
    deadline: "2027-02-02",
    applyUrl: "https://info.weizmann.ac.il/en/kupcinet-getz-international-summer-program/",
  },
  {
    company: "University of Tokyo",
    title: "UTRIP — University of Tokyo Research Internship Program",
    description:
      "5–6 week research internship at the University of Tokyo's Graduate School of Science — physics, chemistry, biology, maths, geoscience and more.",
    eligibility:
      "International undergraduates in natural sciences considering a Master's/PhD. Fully funded — round-trip airfare, accommodation, daily living allowance.",
    countries: "Japan",
    degree: "BACHELOR",
    deadline: "2027-01-10",
    applyUrl: "https://www.s.u-tokyo.ac.jp/en/utrip/",
  },
  {
    company: "Max Planck CS",
    title: "Max Planck Research Internships in Computer Science",
    description:
      "12–14 week fully funded research internship at Max Planck Institutes for Informatics, Software Systems, and Security & Privacy (Saarbrücken/Kaiserslautern).",
    eligibility:
      "Outstanding international bachelor's and Master's students in computer science. Fully funded — monthly living stipend, accommodation, round-trip travel.",
    countries: "Germany",
    degree: "ANY",
    deadline: "2026-11-01",
    applyUrl: "https://www.cis.mpg.de/internships/",
  },
  {
    company: "Tsinghua University",
    title: "Tsinghua Summer Research & Global Internships (China)",
    description:
      "Summer research internships across Tsinghua University's departments — engineering, sciences, computing and beyond, with international participants.",
    eligibility:
      "International undergraduates worldwide; funding varies by department but typically covers stipend and on-campus housing.",
    countries: "China",
    degree: "BACHELOR",
    deadline: null, // rolling / department-specific
    applyUrl: "https://intl.tsinghua.edu.cn/",
  },
  {
    company: "University of Melbourne",
    title: "Melbourne Summer Research Scholarships",
    description:
      "8–10 week paid summer research scholarship across the University of Melbourne's faculties — sciences, engineering, medicine, arts and more.",
    eligibility:
      "Enrolled undergraduates (domestic and international via specific schemes); weekly stipend for the program duration.",
    countries: "Australia",
    degree: "BACHELOR",
    deadline: "2026-11-30",
    applyUrl: "https://about.unimelb.edu.au/careers/working-at-unimelb/summer-research-scholarships",
  },
  {
    company: "USC Viterbi",
    title: "USC Viterbi Summer Research (AMIGO Program)",
    description:
      "Summer research program for international engineering undergraduates at USC Viterbi School of Engineering.",
    eligibility:
      "International undergraduate engineering students at partner institutions or via global application pools; stipend + travel grant provided.",
    countries: "United States",
    degree: "BACHELOR",
    deadline: "2027-02-15",
    applyUrl: "https://viterbischool.usc.edu/",
  },
  {
    company: "NASA",
    title: "NASA OSTEM Internships",
    description:
      "Paid internships at NASA centers and facilities (JPL, Goddard, Wallops…) — engineering, aerospace, computer science, planetary science and more.",
    eligibility:
      "US citizens only; enrolled in a degree program with min. 3.0 GPA. Paid stipend ($8,200–$14,000+ per session depending on level and length).",
    countries: "United States",
    degree: "ANY",
    type: "INTERNSHIP",
    deadline: "2027-02-15",
    applyUrl: "https://www.nasa.gov/learning-resources/internship-programs/",
  },
  {
    company: "NSF REU",
    title: "NSF REU — Research Experiences for Undergraduates (US)",
    description:
      "Summer research at NSF-funded sites across US universities — fully funded with stipend, housing and travel reimbursement.",
    eligibility:
      "US citizens, nationals or permanent residents enrolled as undergraduates. Stipend ~$5,000–$7,000 for the summer plus housing and travel.",
    countries: "United States",
    degree: "BACHELOR",
    deadline: "2027-03-15",
    applyUrl: "https://www.nsf.gov/crssprgm/reu/",
  },
  // ---------------------------------------------------------------------------
  // Fully funded summer schools — structured multi-week academic programs.
  // ---------------------------------------------------------------------------
  {
    company: "ICTP Summer Schools",
    title: "ICTP Summer Schools in Physics & Mathematics (Trieste)",
    description:
      "Fully funded summer schools at the Abdus Salam International Centre for Theoretical Physics — particle physics, cosmology, condensed matter, quantitative life sciences, AI for science.",
    eligibility:
      "Graduate students, postdocs and young researchers worldwide; preference and dedicated support for scientists from developing nations. No tuition; accommodation, subsistence and travel grants for accepted applicants.",
    countries: "Italy",
    degree: "MASTER",
    deadline: null, // varies by school — check the scientific calendar
    applyUrl: "https://www.ictp.it/home/scientific-calendar",
  },
  {
    company: "Les Houches",
    title: "Les Houches School of Physics (France)",
    description:
      "Multi-week advanced physics schools in the French Alps — quantum mechanics, quantum information & gravity, condensed matter and more.",
    eligibility:
      "International PhD students, postdocs and young researchers in theoretical/experimental physics; financial support available for selected participants.",
    countries: "France",
    degree: "PHD",
    deadline: "2026-12-08",
    applyUrl: "https://www.houches-school-physics.com/",
  },
  {
    company: "Cold Spring Harbor",
    title: "Cold Spring Harbor Laboratory Summer Courses (US)",
    description:
      "1–3 week intensive courses in molecular biology, neuroscience, genomics, cancer and synthetic biology at Cold Spring Harbor Laboratory, NY.",
    eligibility:
      "Graduate students, postdocs and early-career researchers worldwide; financial aid, travel awards and corporate sponsorships cover full or partial costs.",
    countries: "United States",
    degree: "PHD",
    deadline: null, // rolling — spring deadlines per course
    applyUrl: "https://meetings.cshl.edu/",
  },
  // ---------------------------------------------------------------------------
  // Saudi Arabia, Hong Kong & Turkey — added Aug 2026, verified against
  // official pages. Saudi Arabia was previously only KAUST; Hong Kong and
  // Turkey had no coverage at all.
  // ---------------------------------------------------------------------------
  {
    company: "KFUPM",
    title: "KFUPM Inbound Summer Research Program (Saudi Arabia)",
    description:
      "8-week summer research program at King Fahd University of Petroleum and Minerals, Dhahran — engineering, sciences and computer science, open to non-KFUPM and international students.",
    eligibility:
      "Non-KFUPM undergraduate students (international welcome) and select high-school students (grades 11–12). Fully funded for accepted participants — stipend, housing and travel support.",
    countries: "Saudi Arabia",
    degree: "BACHELOR",
    deadline: null, // rolling — semester-based call each summer
    applyUrl: "https://ri.kfupm.edu.sa/dr/opportunities/students/undergraduate-students/inbound-summer-research-program/",
  },
  {
    company: "Saudi Aramco",
    title: "Saudi Aramco University Internship Program (UIP)",
    description:
      "Summer internship placements across engineering, geosciences, business and computing at Saudi Aramco, the world's largest energy company.",
    eligibility:
      "High-calibre Saudi students attending in-Kingdom or out-of-Kingdom universities (Saudi citizens studying abroad are eligible; non-Saudi internationals generally not eligible for the standard UIP track). Paid.",
    countries: "Saudi Arabia",
    degree: "BACHELOR",
    type: "INTERNSHIP",
    deadline: null, // rolling — annual calls
    applyUrl: "https://www.aramco.com/en/careers/for-saudi-applicants/student-opportunities",
  },
  {
    company: "HKUST",
    title: "HKUST Summer UG Research Program (SURP)",
    description:
      "Summer undergraduate research placements across HKUST's schools — engineering, science, business and humanities — with faculty-led projects in Clear Water Bay, Hong Kong.",
    eligibility:
      "Undergraduates worldwide (international and local students; non-local participants need a valid student visa). Program fee covers housing, visa, insurance and activities; tuition waived for nominated exchange students.",
    countries: "Hong Kong",
    degree: "BACHELOR",
    deadline: "2027-02-01", // winter/spring call for the summer cohort
    applyUrl: "https://summercampus.hkust.edu.hk/hkust-summer-ug-research-program",
  },
  {
    company: "University of Hong Kong",
    title: "HKU Summer Research Programme",
    description:
      "8-week summer research programme at the University of Hong Kong across all faculties — with a HK$10,000 completion scholarship.",
    eligibility:
      "Outstanding Year 3–4 undergraduates (CGPA 3.6+ or equivalent) and Master's students worldwide. Scholarship of HK$10,000 plus airfare support (up to HK$5,000) and accommodation subsidy (up to HK$5,000) on reimbursement.",
    countries: "Hong Kong",
    degree: "ANY",
    deadline: "2027-02-09", // Jan 9 – Feb 9 window for the prior cohort
    applyUrl: "https://gradsch.hku.hk/news_and_events/news_and_future_events/summer-research-programme-2026",
  },
  {
    company: "CUHK",
    title: "CUHK Summer Undergraduate Research Programme (SURP)",
    description:
      "8-week summer research placement at the Chinese University of Hong Kong — credit-bearing, across STEM, social science and humanities faculties.",
    eligibility:
      "Undergraduates enrolled at overseas or mainland institutions; open to international students globally. Accommodation covered and credits transferable (e.g. 3 credits for the 8-week placement); stipends vary by institutional partnership.",
    countries: "Hong Kong",
    degree: "BACHELOR",
    deadline: "2027-03-01", // early-spring call (Feb–Mar) for the summer cohort
    applyUrl: "https://www.summer.cuhk.edu.hk/surp/",
  },
  {
    company: "PolyU",
    title: "PolyU International Research Summer School (Hong Kong)",
    description:
      "Premier PhD-taster summer school at Hong Kong Polytechnic University — research projects, faculty mentoring and lab immersion for high-achieving students.",
    eligibility:
      "High-achieving undergraduate and postgraduate students worldwide (participants from 15+ countries). Fully or partially funded — accommodation and select stipends for accepted international participants.",
    countries: "Hong Kong",
    degree: "ANY",
    deadline: "2027-03-01", // spring call (Feb–Mar) for the summer cohort
    applyUrl: "https://www.polyu.edu.hk/summerschool/",
  },
  {
    company: "TÜBİTAK",
    title: "TÜBİTAK 2247-C STAR Intern Researcher Programme (Turkey)",
    description:
      "Undergraduate research scholarships on TÜBİTAK-funded projects across Turkey's research institutes and universities.",
    eligibility:
      "Bachelor's students who are Turkish citizens or hold a Blue Card (Mavi Kart, Law No. 5901). International students without Turkish citizenship are generally not eligible. Monthly scholarship (~6,000 TL) for up to 6 months.",
    countries: "Turkey",
    degree: "BACHELOR",
    deadline: null, // multiple term calls year-round via e-BİDEB
    applyUrl: "https://tubitak.gov.tr/en/scholarships/degree-associate-degree/scholarship-programs/2247-c-star-intern-researcher-scholarship-programme",
  },
  {
    company: "Koç University",
    title: "Koç University Summer Research Program (KUSRP)",
    description:
      "Summer research placements across Koç University's colleges in Istanbul — natural sciences, engineering, social sciences and health sciences.",
    eligibility:
      "Motivated undergraduate and graduate students (plus high-school tracks) — domestic and international. Program is free of charge (no tuition); limited housing may be provided.",
    countries: "Turkey",
    degree: "ANY",
    deadline: "2027-05-15", // mid-May for the summer intake
    applyUrl: "https://research.ku.edu.tr/research-outreach/summer-research/kusrp/",
  },
  {
    company: "Sabancı University",
    title: "Sabancı PURE Summer Research Program (Istanbul)",
    description:
      "7-week immersive research program at Sabancı University — projects across engineering, natural sciences, arts and social sciences.",
    eligibility:
      "Undergraduates from Sabancı and external universities, domestic and international. Specific tracks can be fully funded (accommodation/stipend via partner scholarships such as Türkiye Scholarships).",
    countries: "Turkey",
    degree: "BACHELOR",
    deadline: "2027-04-15", // spring call (Mar–Apr) for the summer intake
    applyUrl: "https://pure.sabanciuniv.edu/",
  },
  {
    company: "Bilkent University",
    title: "Bilkent Summer Research Internships (Ankara)",
    description:
      "Summer research internships across Bilkent University departments — molecular biology & genetics, engineering, sciences and more.",
    eligibility:
      "Talented undergraduates from Bilkent and external/international universities. Most positions are unpaid (students arrange own health insurance per Turkish law); some departments fund.",
    countries: "Turkey",
    degree: "BACHELOR",
    deadline: "2027-04-30", // annual late-April close
    applyUrl: "https://mbg.bilkent.edu.tr/internships/",
  },
  // ---------------------------------------------------------------------------
  // South Korea & Austria Complexity Science Hub — added Aug 2026, verified
  // against official pages. South Korea previously only had KAIST-X.
  // ---------------------------------------------------------------------------
  {
    company: "GIST",
    title: "GIST Global Intern Program (GIP)",
    description:
      "Summer research internship at Gwangju Institute of Science and Technology — physics, chemistry, life sciences, AI, engineering and more.",
    eligibility:
      "International undergraduate seniors or Master's students with a minimum cumulative GPA of 3.0/4.0. Fully funded — monthly stipend, dormitory accommodation and partial airfare reimbursement.",
    countries: "South Korea",
    degree: "ANY",
    deadline: "2027-02-27", // late-Feb for the summer cohort (Feb 27 in the prior cycle)
    applyUrl: "https://www.gist.ac.kr/en/html/sub07/0702.html",
  },
  {
    company: "DGIST",
    title: "DGIST Summer Research Internship (South Korea)",
    description:
      "Summer research internship at Daegu Gyeongbuk Institute of Science and Technology — engineering, information & communication, basic science, energy and robotics.",
    eligibility:
      "International undergraduates who have completed at least 4 semesters with a GPA of 3.0/4.0 or higher. Living stipend (~KRW 918,000) + free on-campus accommodation; flights/visa covered by the student.",
    countries: "South Korea",
    degree: "BACHELOR",
    deadline: "2027-03-04", // early-March (Feb 10 – Mar 4 in the prior cycle)
    applyUrl: "https://www.dgist.ac.kr/prog/intrlInternPrgrm/en_college/sub06_02/main.do",
  },
  {
    company: "POSTECH",
    title: "POSTECH Summer Program (PSP) — Research Track",
    description:
      "Summer research placements in POSTECH's science and engineering labs — Pohang, South Korea.",
    eligibility:
      "Undergraduate and graduate students worldwide seeking STEM research experience. Fully funded — typically covers airfare, accommodation, program fees and cultural excursions.",
    countries: "South Korea",
    degree: "ANY",
    deadline: "2027-02-15", // mid-February for the summer cohort
    applyUrl: "https://international.postech.ac.kr/user/admission/psp/html/01.do",
  },
  {
    company: "Yonsei University",
    title: "Yonsei International Summer School Internship (YISSI)",
    description:
      "International internship placements in Seoul as part of the Yonsei International Summer School — 2-credit internship course alongside summer courses.",
    eligibility:
      "International university students enrolled in YISS (taking at least 2 courses, including the 2-credit internship course) with a minimum GPA of 2.0/4.0. High-school seniors and local Yonsei students ineligible. Unpaid academic-credit internship.",
    countries: "South Korea",
    degree: "BACHELOR",
    deadline: "2027-03-17", // mid-March (Mar 17 in the prior cycle)
    applyUrl: "https://summer.yonsei.ac.kr/summer/program/internship.do",
  },
  {
    company: "Korea University",
    title: "Korea University International Summer Campus (ISC)",
    description:
      "Summer study + research options at Korea University's International Summer Campus in Seoul, with internship opportunities through partner programs.",
    eligibility:
      "International undergraduate and graduate students enrolled at accredited foreign universities. Tuition-based with scholarships available through partner exchanges.",
    countries: "South Korea",
    degree: "ANY",
    deadline: "2027-05-15", // mid-May (May 15 in the prior cycle)
    applyUrl: "https://isc.korea.ac.kr/",
  },
  {
    company: "Complexity Science Hub",
    title: "Complexity Science Hub Vienna — Research Positions & Internships",
    description:
      "Research opportunities at the Complexity Science Hub Vienna — data-driven research on complex systems: networks, digital society, cities, health and economy.",
    eligibility:
      "Students and researchers in data science, computer science, physics, mathematics, network science or related fields. Open positions include PhD, PostDoc and internship roles; applications are rolling.",
    countries: "Austria",
    degree: "ANY",
    deadline: null, // rolling — positions posted year-round
    applyUrl: "https://csh.ac.at/engage/jobs/",
  },
  // ---------------------------------------------------------------------------
  // Pakistan — added Aug 2026, verified against official pages. Pakistan had
  // zero coverage before; these are the main structured research internships
  // hosted in-country (NUST's NIPIS is explicitly for international students).
  // ---------------------------------------------------------------------------
  {
    company: "NUST",
    title: "NUST International Summer Research Internship (NIPIS)",
    description:
      "Research internship for international students at the National University of Sciences and Technology (NUST), H-12 Islamabad — placements across engineering, science and computing departments alongside cultural exchange.",
    eligibility:
      "International undergraduate and graduate students seeking immersive research and cultural exchange in Pakistan. Domestic NUST students apply through departmental slots. Funding for travel/living generally self-arranged by participants.",
    countries: "Pakistan",
    degree: "ANY",
    deadline: "2026-06-25", // prior cohort ran Jul 20 – Aug 14, registered by Jun 25
    applyUrl: "https://nipis.nust.edu.pk/#/register",
  },
  {
    company: "LUMS SBASSE",
    title: "LUMS RISE — Research Internships in Science & Engineering",
    description:
      "Summer research placements at the Syed Babar Ali School of Science and Engineering (SBASSE), Lahore University of Management Sciences — STEM research across labs and faculty-led projects.",
    eligibility:
      "STEM students — high school (grade 11+) and undergraduates with strong academic records; primarily national and regional applicants. Some tracks offer fellowships or stipends; others are experience-based. Applications open in spring.",
    countries: "Pakistan",
    degree: "BACHELOR",
    deadline: null, // spring call, rolling by track
    applyUrl: "https://sbasse.lums.edu.pk/rise-at-sse-lums",
  },
  {
    company: "Habib University",
    title: "Habib University Summer Tehqiq Research Program (STRP)",
    description:
      "Summer research at Habib University, Karachi — STRP 1 matches students with faculty-led projects; STRP 2 supports independent student-designed research with a faculty supervisor.",
    eligibility:
      "Undergraduate students; open to Habib University students and select external applicants depending on partnership guidelines. Project-based mentoring and faculty-allocated support.",
    countries: "Pakistan",
    degree: "BACHELOR",
    deadline: null, // spring application cycle
    applyUrl: "https://habib.edu.pk/research-at-habib/summer-tehqiq-research-program/",
  },
  {
    company: "National Centre for Physics",
    title: "NCP Islamabad Summer Student Program",
    description:
      "Summer research internships at the National Centre for Physics (NCP), Islamabad — physics, engineering and materials science tracks including specialised labs (e.g. PIAM3D additive manufacturing).",
    eligibility:
      "Undergraduate or graduate students in physics, engineering, materials science or related STEM disciplines. Primarily open to Pakistani nationals due to federal security-clearance protocols; most specialised tracks are unpaid/volunteer with hands-on training.",
    countries: "Pakistan",
    degree: "ANY",
    deadline: null, // varies by division / announcement cycle
    applyUrl: "https://www.ncp.edu.pk/piam3d-intern.php",
  },
  {
    company: "IST Islamabad",
    title: "NCGSA Space Summer Internship (Institute of Space Technology)",
    description:
      "6–8 week summer internship at the National Center of GIS & Space Applications (NCGSA), Institute of Space Technology (IST), Islamabad — space science, remote sensing, GIS and astronomy.",
    eligibility:
      "University and college students passionate about space science, remote sensing, GIS and astronomy. Structured hands-on training programme.",
    countries: "Pakistan",
    degree: "ANY",
    deadline: "2026-07-05", // early-July registration for the summer cohort
    applyUrl: "https://ncgsa.org.pk/internships/",
  },
  {
    company: "ICCBS Karachi",
    title: "ICCBS Summer Internship Program (Karachi)",
    description:
      "Summer research internship at the International Center for Chemical and Biological Sciences, University of Karachi — H.E.J. Research Institute of Chemistry and Dr. Panjwani Center for Molecular Medicine and Drug Research.",
    eligibility:
      "Competitive programme for undergraduate and graduate science students meeting academic benchmarks (strong GPA / completed credit hours). Runs roughly June 1 – August 31.",
    countries: "Pakistan",
    degree: "ANY",
    deadline: null, // announced annually ahead of summer term
    applyUrl: "https://iccs.edu/page-summer-internship",
  },
  {
    company: "GIKI",
    title: "GIKI Summer Research Internships (Topi)",
    description:
      "Summer research and industrial placements at Ghulam Ishaq Khan Institute of Engineering Sciences and Technology, Topi — engineering and science departments, hosted through the GIKI internship portal and Career Services.",
    eligibility:
      "Enrolled undergraduate engineering and science students. Both paid and unpaid tracks depending on the department or industrial/research host assignment. Applications managed dynamically ahead of summer break.",
    countries: "Pakistan",
    degree: "BACHELOR",
    deadline: null, // rolling through the internship portal
    applyUrl: "https://giki.edu.pk/internship/",
  },
];

// Backfill eligibility + country + deadline for the two research rows that
// already existed in the legacy data, so every research listing carries both
// fields and no stale scrape-artifact deadlines.
const BACKFILL: { company: string; countries: string; eligibility: string; deadline: string | null }[] = [
  {
    company: "IST Austria",
    countries: "Austria",
    eligibility:
      "Undergraduates in biology, computer science, mathematics or physics with strong academic standing — apply early, places are limited. Scientific internships are rolling (no fixed deadline).",
    deadline: null, // scientific internships at ISTA are rolling
  },
  {
    company: "MPIA",
    countries: "Germany",
    eligibility:
      "Undergraduate students in physics, astronomy or related fields; research experience not required but a strong physics/maths background is expected.",
    deadline: "2027-01-16", // MPIA summer studentships close mid-January
  },
];

async function main() {
  let created = 0;
  let updated = 0;

  for (const p of PROGRAMS) {
    const guid = `curated:${p.company.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const data = {
      company: p.company,
      title: p.title,
      description: p.description,
      eligibility: p.eligibility,
      countries: p.countries,
      degree: p.degree,
      type: p.type ?? "RESEARCH_INTERNSHIP",
      deadline: p.deadline ? new Date(`${p.deadline}T12:00:00`) : null, // local noon — safe on the calendar in any timezone; null = paused/rolling
      applyUrl: p.applyUrl,
      sourceFeed: "Curated programs",
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

  for (const b of BACKFILL) {
    const res = await prisma.opportunity.updateMany({
      where: { company: b.company, type: "RESEARCH_INTERNSHIP" },
      data: {
        eligibility: b.eligibility,
        countries: b.countries,
        deadline: b.deadline ? new Date(`${b.deadline}T12:00:00`) : null,
      },
    });
    if (res.count > 0) updated += res.count;
  }

  await prisma.$disconnect();
  console.log(`Research programmes ready — created ${created}, updated ${updated}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
