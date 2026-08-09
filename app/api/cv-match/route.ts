import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import pdfParse from "pdf-parse";
import { prisma } from "@/lib/prisma";
import { heuristicMatch } from "@/lib/cv-heuristic";

// POST /api/cv-match
// multipart/form-data: cv (PDF file), jobDescription (string), apiKey (string),
// applicationId (optional string) — if present, caches the result on that card.
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const cvFile = form.get("cv") as File | null;
  const jobDescription = (form.get("jobDescription") as string) || "";
  const apiKey = (form.get("apiKey") as string) || "";
  const applicationId = form.get("applicationId") as string | null;

  if (!cvFile) return NextResponse.json({ error: "No CV file uploaded." }, { status: 400 });
  if (!jobDescription.trim()) return NextResponse.json({ error: "Job description is required." }, { status: 400 });

  let cvText = "";
  try {
    const buffer = Buffer.from(await cvFile.arrayBuffer());
    const parsed = await pdfParse(buffer);
    cvText = parsed.text.slice(0, 15000); // guard against huge PDFs blowing the context
  } catch {
    return NextResponse.json({ error: "Couldn't read that PDF. Make sure it's a valid, text-based CV." }, { status: 400 });
  }

  if (!cvText.trim()) {
    return NextResponse.json(
      { error: "Couldn't extract any text from that PDF — it may be a scanned image. Upload a text-based CV." },
      { status: 400 }
    );
  }

  // No API key? Use the built-in local heuristic matcher — no external calls.
  if (!apiKey.trim()) {
    const result = heuristicMatch(cvText, jobDescription);
    await saveResult(applicationId, result);
    return NextResponse.json({ result });
  }

  const prompt = `You are an experienced technical recruiter. Compare the candidate's CV against the job description below and respond with STRICT JSON only — no markdown fences, no preamble, no commentary outside the JSON object.

Schema:
{
  "matchScore": <integer 0-100>,
  "strengths": [<string, ...>],
  "gaps": [<string, ...>],
  "summary": "<one paragraph, 3-5 sentences>"
}

CV:
"""${cvText}"""

Job description:
"""${jobDescription.slice(0, 8000)}"""`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    let parsed: { matchScore: number; strengths: string[]; gaps: string[]; summary: string };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "The AI response wasn't valid JSON. Try again." }, { status: 502 });
    }

    await saveResult(applicationId, parsed);

    return NextResponse.json({ result: { ...parsed, mode: "ai" } });
  } catch (err: any) {
    const message = err?.message?.includes("API key")
      ? "That Gemini API key was rejected. Double-check it and try again."
      : "Gemini request failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

async function saveResult(
  applicationId: string | null,
  r: { matchScore: number; strengths: string[]; gaps: string[]; summary: string }
) {
  if (!applicationId) return;
  await prisma.cvMatchResult.upsert({
    where: { applicationId },
    create: {
      applicationId,
      matchScore: r.matchScore,
      strengths: JSON.stringify(r.strengths),
      gaps: JSON.stringify(r.gaps),
      summary: r.summary,
    },
    update: {
      matchScore: r.matchScore,
      strengths: JSON.stringify(r.strengths),
      gaps: JSON.stringify(r.gaps),
      summary: r.summary,
    },
  });
}
