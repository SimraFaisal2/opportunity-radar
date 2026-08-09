import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { scoreOpportunity } from "@/lib/cv-heuristic";
import { normalizeCountriesField } from "@/lib/countries";

// PDF parsing + a Gemini call can exceed Vercel's default 10s Hobby limit.
export const maxDuration = 60;

// POST /api/cv-match/suggest
// multipart/form-data: cv (PDF file), apiKey (optional string).
// No key  → score the whole board locally (free, offline, nothing leaves the server).
// With key → pre-filter the board locally, then send the shortlist + CV to Gemini,
//            which returns strict-JSON ranked recommendations (candidate profile,
//            per-internship fit score/reasons/gaps, general advice).
export async function POST(req: NextRequest) {
  let cvFile: File | null = null;
  let apiKey = "";
  try {
    const form = await req.formData();
    cvFile = form.get("cv") as File | null;
    apiKey = (form.get("apiKey") as string) || "";
  } catch {
    return NextResponse.json({ error: "Upload your CV as a PDF (multipart form)." }, { status: 400 });
  }

  if (!cvFile) return NextResponse.json({ error: "No CV file uploaded." }, { status: 400 });

  let cvText = "";
  try {
    const buffer = Buffer.from(await cvFile.arrayBuffer());
    const parsed = await pdfParse(buffer);
    cvText = parsed.text.slice(0, 15000);
  } catch {
    return NextResponse.json({ error: "Couldn't read that PDF. Make sure it's a valid, text-based CV." }, { status: 400 });
  }

  if (!cvText.trim()) {
    return NextResponse.json(
      { error: "Couldn't extract any text from that PDF — it may be a scanned image. Upload a text-based CV." },
      { status: 400 }
    );
  }

  const opportunities = await prisma.opportunity.findMany({
    orderBy: [{ deadline: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
    include: { application: true },
  });

  // Local pre-ranking (used directly with no key, and to build the AI shortlist).
  // Pakistan listings are excluded — they're only visible via the Countries page.
  const oppText = (o: (typeof opportunities)[number]) =>
    [o.title, o.company, o.description ?? "", o.eligibility ?? ""].join(" ");
  const isPakistan = (o: (typeof opportunities)[number]) =>
    normalizeCountriesField(o.countries).split(",").map((c) => c.trim()).includes("Pakistan");
  const scored = opportunities.filter((o) => !isPakistan(o)).map((o) => ({
    ...o,
    score: scoreOpportunity(cvText, oppText(o)),
  }));

  // --- Gemini mode (key provided) ------------------------------------------------
  if (apiKey.trim()) {
    // Send a generous local shortlist so the AI works from a sensible pool but
    // isn't blind to matches the heuristic under-weights. Context is cheap on
    // 1.5-flash; the threshold is deliberately below the local-only cutoff.
    const pool = scored
      .filter((s) => s.score >= 30)
      .sort((a, b) => b.score - a.score)
      .slice(0, 60);

    if (pool.length === 0) {
      return NextResponse.json({
        suggestions: [],
        mode: "heuristic",
        profile: null,
        generalAdvice:
          "No opportunities on the board clear the basic relevance bar for this CV. Add more skills or research areas to your CV, or check back as new listings arrive.",
      });
    }

    const poolById = new Map(pool.map((o) => [o.id, o]));
    const shortlist = pool.map((o) => ({
      id: o.id,
      title: o.title,
      company: o.company,
      countries: normalizeCountriesField(o.countries),
      description: (o.description ?? "").slice(0, 300),
    }));

    const prompt = `You are a career-advising assistant that analyzes a candidate's CV and recommends the best-fitting internships from a provided list. Base every recommendation strictly on what is stated in the CV — never invent skills, coursework, or experience.

Return valid JSON only, no markdown, no code fences, no commentary outside the JSON. Use exactly this schema:

{
  "candidate_profile": {
    "key_skills": ["<skill evidenced in CV>"],
    "field_of_study": "<field, or 'unclear' if not stated>",
    "experience_level": "<one of: 'no experience', 'some coursework/projects', 'prior internship(s)', 'work experience'>"
  },
  "recommendations": [
    {
      "internship_id": "<id from the provided list>",
      "title": "<internship title>",
      "fit_score": <integer 0-100>,
      "why_it_fits": "<1-2 sentences citing specific CV evidence>",
      "skill_gaps": ["<requirement the candidate doesn't yet show>"]
    }
  ],
  "general_advice": "<1-2 sentences of constructive advice for the candidate, e.g. skills to build or how to frame their experience>"
}

Rules:
- Only recommend internships that appear in the provided list — never invent one.
- Rank "recommendations" from highest to lowest fit_score.
- If fewer than 3 internships are a reasonable fit, return fewer rather than padding the list with poor matches.
- Do not penalize for CV formatting, length, or non-native phrasing — evaluate substance only.
- Be honest in skill_gaps rather than glossing over mismatches.

Candidate CV:
"""${cvText}"""

Provided list of internships (JSON):
${JSON.stringify(shortlist)}`;

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const raw = result.response.text().trim();
      const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/, "").trim();

      let parsed: {
        candidate_profile?: { key_skills?: string[]; field_of_study?: string; experience_level?: string };
        recommendations?: { internship_id?: string; title?: string; fit_score?: number; why_it_fits?: string; skill_gaps?: string[] }[];
        general_advice?: string;
      };
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        return NextResponse.json({ error: "The AI response wasn't valid JSON. Try again." }, { status: 502 });
      }

      // Map the AI's picks back to full opportunity rows; drop anything it
      // hallucinated outside the provided list, and dedupe repeated ids.
      const recs = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
      const seen = new Set<string>();
      const suggestions = recs
        .map((r) => {
          const o = r.internship_id ? poolById.get(r.internship_id) : undefined;
          if (!o) return null;
          return {
            id: o.id,
            company: o.company,
            title: o.title,
            type: o.type,
            degree: o.degree,
            countries: normalizeCountriesField(o.countries),
            deadline: o.deadline,
            applyUrl: o.applyUrl,
            score: Math.max(0, Math.min(100, Math.round(Number(r.fit_score) || 0))),
            application: o.application,
            whyItFits: r.why_it_fits || "",
            skillGaps: Array.isArray(r.skill_gaps) ? r.skill_gaps.slice(0, 5) : [],
          };
        })
        .filter((s): s is NonNullable<typeof s> => {
          if (!s || seen.has(s.id)) return false;
          seen.add(s.id);
          return true;
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 12);

      return NextResponse.json({
        suggestions,
        mode: "ai",
        profile: parsed.candidate_profile && typeof parsed.candidate_profile === "object" ? parsed.candidate_profile : null,
        generalAdvice: parsed.general_advice || "",
      });
    } catch (err: any) {
      // Graceful degradation: the local matcher always works, so fall back to it
      // and say why, rather than returning zero suggestions on a bad key/quota.
      const warning = err?.message?.includes("API key")
        ? "That Gemini API key was rejected — showing local estimates instead."
        : "Gemini request failed — showing local estimates instead.";
      const fallback = scored
        .filter((s) => s.score >= 40)
        .sort((a, b) => b.score - a.score || (a.deadline ? 1 : -1) - (b.deadline ? 1 : -1))
        .slice(0, 12)
        .map((o) => ({
          id: o.id,
          company: o.company,
          title: o.title,
          type: o.type,
          degree: o.degree,
          countries: normalizeCountriesField(o.countries),
          deadline: o.deadline,
          applyUrl: o.applyUrl,
          score: o.score,
          application: o.application,
        }));
      return NextResponse.json({ suggestions: fallback, mode: "heuristic", profile: null, generalAdvice: "", warning });
    }
  }

  // --- Local mode (no key) -------------------------------------------------------
  const suggestions = scored
    .filter((s) => s.score >= 40)
    .sort((a, b) => b.score - a.score || (a.deadline ? 1 : -1) - (b.deadline ? 1 : -1))
    .slice(0, 12)
    .map((o) => ({
      id: o.id,
      company: o.company,
      title: o.title,
      type: o.type,
      degree: o.degree,
      countries: normalizeCountriesField(o.countries),
      deadline: o.deadline,
      applyUrl: o.applyUrl,
      score: o.score,
      application: o.application,
    }));

  return NextResponse.json({ suggestions, mode: "heuristic", profile: null, generalAdvice: "" });
}
