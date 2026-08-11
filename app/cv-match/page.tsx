"use client";

import { useEffect, useState } from "react";
import {
  UploadCloud, KeyRound, Sparkles, CheckCircle2, XCircle, Search, Plus, Check,
  ExternalLink,
} from "lucide-react";
import clsx from "clsx";

interface MatchResult {
  matchScore: number;
  strengths: string[];
  gaps: string[];
  summary: string;
  mode?: "heuristic" | "ai";
}

interface Suggestion {
  id: string;
  company: string;
  title: string;
  type: string;
  degree: string;
  countries: string;
  deadline: string | null;
  applyUrl: string | null;
  score: number;
  application: { id: string } | null;
  whyItFits?: string;
  skillGaps?: string[];
}

interface SuggestProfile {
  key_skills?: string[];
  field_of_study?: string;
  experience_level?: string;
}

const STORAGE_KEY = "gemini_api_key"; // stored client-side only, never sent anywhere but our own API route

export default function CvMatchPage() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [linkedApp, setLinkedApp] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [suggestMode, setSuggestMode] = useState<"ai" | "heuristic" | null>(null);
  const [suggestProfile, setSuggestProfile] = useState<SuggestProfile | null>(null);
  const [suggestAdvice, setSuggestAdvice] = useState("");
  const [suggestWarning, setSuggestWarning] = useState("");
  const [trackingId, setTrackingId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setApiKey(saved);

    // If we arrived from the pipeline (Match on a card), prefill the job
    // description from that application's linked opportunity, and remember the
    // id so the result is cached back onto the card.
    const params = new URLSearchParams(window.location.search);
    const id = params.get("applicationId");
    if (id) {
      setApplicationId(id);
      fetch(`/api/applications/${id}`)
        .then((r) => r.json())
        .then((data) => {
          const app = data.application as
            | { company: string; role: string; opportunity?: { description?: string | null } | null }
            | undefined;
          if (app) {
            setLinkedApp(`${app.company} — ${app.role}`);
            if (app.opportunity?.description) {
              setJobDescription(app.opportunity.description);
            }
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveKey(key: string) {
    setApiKey(key);
    localStorage.setItem(STORAGE_KEY, key);
  }

  // Score the whole opportunity board against the CV — no job description
  // needed. No key = free local ranking; key present = Gemini ranks a shortlist
  // with reasons and skill gaps.
  async function handleSuggest() {
    setError(null);
    setSuggestions(null);
    setSuggestProfile(null);
    setSuggestAdvice("");
    setSuggestWarning("");
    if (!file) return setError("Upload your CV as a PDF first.");

    setSuggesting(true);
    const form = new FormData();
    form.append("cv", file);
    if (apiKey.trim()) form.append("apiKey", apiKey.trim());
    try {
      const res = await fetch("/api/cv-match/suggest", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Something went wrong.");
      else {
        setSuggestions(data.suggestions || []);
        setSuggestMode(data.mode || "heuristic");
        setSuggestProfile(data.profile || null);
        setSuggestAdvice(data.generalAdvice || "");
        setSuggestWarning(data.warning || "");
      }
    } catch {
      setError("Network error — couldn't reach the matcher.");
    }
    setSuggesting(false);
  }

  async function handleTrackSuggestion(oppId: string) {
    setTrackingId(oppId);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId: oppId }),
      });
      if (!res.ok) throw new Error("track failed");
      setSuggestions((prev) =>
        (prev || []).map((s) => (s.id === oppId ? { ...s, application: { id: "tracked" } } : s))
      );
    } catch {
      setError("Couldn't track that opportunity — try again.");
    }
    setTrackingId(null);
  }

  const suggScoreColor = (score: number) => (score >= 75 ? "text-leaf" : score >= 50 ? "text-sun" : "text-coral");
  const suggKind = (t: string) =>
    t === "SCHOLARSHIP" ? "Scholarship" : t === "RESEARCH_INTERNSHIP" ? "Research" : t === "INTERNSHIP" ? "Internship" : "Opportunity";

  async function handleSubmit() {
    setError(null);
    setResult(null);
    if (!file) return setError("Upload your CV as a PDF first.");
    if (!jobDescription.trim()) return setError("Paste the job description.");

    setLoading(true);
    const form = new FormData();
    form.append("cv", file);
    form.append("jobDescription", jobDescription);
    if (apiKey.trim()) form.append("apiKey", apiKey); // omitted → server uses the free local matcher
    if (applicationId) form.append("applicationId", applicationId);

    try {
      const res = await fetch("/api/cv-match", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Something went wrong.");
      else setResult(data.result);
    } catch {
      setError("Network error — couldn't reach the matcher.");
    }
    setLoading(false);
  }

  // green = great, yellow = needs work, red = weak (dark-tuned hues)
  const scoreColor = (score: number) => (score >= 75 ? "text-leaf" : score >= 50 ? "text-sun" : "text-coral");

  return (
    <div className="max-w-3xl">
      <h1 className="font-display font-extrabold text-2xl text-ink mb-0.5">AI CV Matcher</h1>
      <p className="text-inkDim text-sm mb-6">
        No API key needed — matches run locally on skill overlap for free. Add a Gemini key for a deeper AI analysis.
      </p>

      {linkedApp && (
        <div className="bg-accent/10 border border-accent/40 rounded-lg px-3 py-2 text-sm text-ink mb-4 flex items-center gap-2">
          <Sparkles size={14} className="text-accent shrink-0" />
          Matching against <span className="font-bold">{linkedApp}</span> — the score will be saved to that pipeline card.
        </div>
      )}

      <div className="duo-card p-4 mb-4">
        <label className="flex items-center gap-2 text-sm text-ink mb-2 font-bold">
          <KeyRound size={14} /> Gemini API key <span className="text-inkDim font-normal">(optional)</span>
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => saveKey(e.target.value)}
          placeholder="Leave empty for the free local matcher…"
          className="input font-mono"
        />
        <p className="text-xs text-inkDim mt-1.5">
          Empty = instant local estimate (skill overlap, nothing leaves your device). Add a free key at{" "}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-accent font-bold hover:text-accentBright transition-colors">
            aistudio.google.com/apikey
          </a>{" "}
          for a deeper AI analysis — stored only in your browser's local storage.
        </p>
      </div>

      <div className="duo-card p-4 mb-4">
        <label className="flex items-center gap-2 text-sm text-ink mb-2 font-bold">
          <UploadCloud size={14} /> Your CV (PDF)
        </label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full text-sm text-inkDim file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-accent file:text-[#0A0A0A] file:text-sm file:font-semibold hover:file:bg-accentBright transition-colors"
        />
        {file && <p className="text-xs text-leaf font-bold mt-1.5">{file.name} selected</p>}
      </div>

      <div className="duo-card p-4 mb-4">
        <label className="text-sm text-ink mb-2 font-bold block">Job description</label>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={8}
          placeholder="Paste the full internship / job description here…"
          className="input resize-y"
        />
      </div>

      {error && <p className="text-sm font-bold text-bad mb-4">{error}</p>}

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="duo-btn duo-btn-green px-5 py-2.5 text-sm"
        >
          <Sparkles size={15} className={clsx(loading && "animate-pulse")} />
          {loading ? "Analyzing…" : "Check my match"}
        </button>
        <button
          onClick={handleSuggest}
          disabled={suggesting}
          className="duo-btn px-5 py-2.5 text-sm"
        >
          <Search size={15} className={clsx(suggesting && "animate-pulse")} />
          {suggesting ? "Scanning 500+ listings…" : "Suggest internships for my CV"}
        </button>
      </div>

      {suggestions && (
        <div className="mt-2 duo-card p-5 mb-4">
          <div className="flex items-center justify-between gap-3 mb-1">
            <p className="text-sm font-bold text-ink">🎯 Best matches for your CV</p>
            {suggestMode === "ai" ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-leaf bg-leafSoft border border-leaf/30 rounded-full px-2.5 py-1">
                ✨ Gemini AI ranking
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sun bg-sunSoft border border-sun/40 rounded-full px-2.5 py-1">
                ⚡ Local estimate — no API key used
              </span>
            )}
          </div>
          <p className="text-xs text-inkDim mb-4">
            Ranked from all board listings against your CV.
          </p>

          {suggestProfile && (
            <div className="mb-4 rounded-lg border border-hairline bg-accent/[0.03] px-3 py-2.5">
              <p className="text-xs font-bold text-ink mb-1.5">
                Candidate profile{' '}
                {suggestProfile.experience_level && (
                  <span className="font-mono text-inkDim normal-case">· {suggestProfile.experience_level}</span>
                )}
              </p>
              {suggestProfile.field_of_study && (
                <p className="text-xs text-inkDim mb-1">
                  <span className="text-inkFaint">Field:</span> {suggestProfile.field_of_study}
                </p>
              )}
              {suggestProfile.key_skills && suggestProfile.key_skills.length > 0 && (
                <p className="text-xs text-inkDim">
                  <span className="text-inkFaint">Skills:</span>{" "}
                  {suggestProfile.key_skills.slice(0, 10).join(", ")}
                </p>
              )}
            </div>
          )}

          {suggestWarning && (
            <div className="mb-4 rounded-lg border border-sun/40 bg-sunSoft px-3 py-2.5 text-xs text-ink">
              <span className="font-bold text-sun">⚠️ {suggestWarning}</span>
            </div>
          )}

          {suggestAdvice && (
            <div className="mb-4 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2.5 text-xs text-ink">
              <span className="font-bold text-accent">💡 Advice: </span>
              {suggestAdvice}
            </div>
          )}
          {suggestions.length === 0 ? (
            <p className="text-sm text-inkDim">
              {suggestMode === "ai"
                ? "The AI found no strong matches in the shortlist — try a CV that mentions specific skills, languages or research areas."
                : "No strong matches found — try a CV that mentions specific skills, languages or research areas."}
            </p>
          ) : (
            <ol className="space-y-2">
              {suggestions.map((s, i) => (
                <li
                  key={s.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-hairline bg-accent/[0.03] hover:bg-accent/[0.05] transition-colors"
                >
                  <span className="font-mono text-xs text-inkFaint w-5 shrink-0 tabular-nums">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-ink truncate">{s.company}</p>
                    <p className="text-xs text-inkDim truncate">
                      {s.title} · <span className="uppercase text-[10px]">{suggKind(s.type)}</span>
                    </p>
                    {s.whyItFits && <p className="text-xs text-inkFaint mt-0.5 leading-snug line-clamp-2">{s.whyItFits}</p>}
                    {s.skillGaps && s.skillGaps.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {s.skillGaps.slice(0, 3).map((g, gi) => (
                          <span
                            key={gi}
                            title={g}
                            className="text-[10px] text-coral bg-coral/10 border border-coral/20 rounded-full px-1.5 py-0.5 max-w-[220px] truncate"
                          >
                            − {g}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="hidden sm:block text-xs text-inkDim shrink-0">
                    {s.countries}
                    {s.deadline && <span className="block font-mono">Due {new Date(s.deadline).toLocaleDateString()}</span>}
                  </div>
                  <span className={clsx("font-mono text-sm font-bold tabular-nums w-12 text-right shrink-0", suggScoreColor(s.score))}>
                    {s.score}%
                  </span>
                  <a
                    href={s.applyUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-accent hover:text-accentBright transition-colors shrink-0 flex items-center gap-1"
                  >
                    Apply <ExternalLink size={11} />
                  </a>
                  <button
                    onClick={() => handleTrackSuggestion(s.id)}
                    disabled={!!s.application || trackingId === s.id}
                    className={clsx(
                      s.application
                        ? "flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border cursor-default border-leaf/40 bg-leafSoft text-leaf shrink-0"
                        : "flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border border-hairline text-inkDim hover:text-ink hover:border-hairlineStrong transition-colors shrink-0"
                    )}
                  >
                    {s.application ? <Check size={11} /> : <Plus size={11} />}
                    {s.application ? "Tracked" : "Track"}
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {result && applicationId && (
        <p className="mt-4 text-xs font-bold text-leaf">✓ Score saved to the application card in your pipeline.</p>
      )}

      {result && (
        <div className="mt-2 duo-card p-5">
          <div className="mb-3">
            {result.mode === "heuristic" ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sun bg-sunSoft border border-sun/40 rounded-full px-2.5 py-1">
                ⚡ Local estimate — no API key used
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-leaf bg-leafSoft border border-leaf/30 rounded-full px-2.5 py-1">
                ✨ Gemini AI analysis
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className={clsx("font-display font-black text-5xl", scoreColor(result.matchScore))}>
              {result.matchScore}%
            </div>
            <div>
              <p className="text-ink font-bold text-sm">Match score</p>
              <p className="text-inkDim text-xs">Based on your CV vs. this job description</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm font-bold text-leaf flex items-center gap-1.5 mb-2">
                <CheckCircle2 size={14} /> Strengths
              </p>
              <ul className="space-y-1.5">
                {result.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-inkDim">• {s}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-bold text-coral flex items-center gap-1.5 mb-2">
                <XCircle size={14} /> Gaps
              </p>
              <ul className="space-y-1.5">
                {result.gaps.map((g, i) => (
                  <li key={i} className="text-sm text-inkDim">• {g}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-hairline pt-3">
            <p className="text-sm font-bold text-ink mb-1">📝 Summary</p>
            <p className="text-sm text-inkDim">{result.summary}</p>
          </div>
        </div>
      )}
    </div>
  );
}
