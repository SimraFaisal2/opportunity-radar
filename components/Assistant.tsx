"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Send, ArrowRight, Gamepad2, MessageSquare, Play, RotateCcw } from "lucide-react";
import clsx from "clsx";

// Quick filters the assistant can jump to — each deep-links the board with
// the right ?type= / ?degree= / ?field= / ?country= params.
const ACTIONS: { label: string; params: string }[] = [
  { label: "Internships", params: "type=INTERNSHIP" },
  { label: "Research programs", params: "type=RESEARCH_INTERNSHIP" },
  { label: "Summer schools", params: "type=SUMMER_SCHOOL" },
  { label: "Scholarships", params: "type=SCHOLARSHIP" },
  { label: "Bachelor", params: "degree=BACHELOR" },
  { label: "CS roles", params: "field=SOFTWARE" },
  { label: "Canada", params: "country=Canada" },
  { label: "Germany", params: "country=Germany" },
];

// Honest, keyword-matched answers — no API key, no made-up facts.
const FAQ: { keys: string[]; answer: string }[] = [
  {
    keys: ["sync", "refresh", "update", "feed"],
    answer: "Sync pulls the newest postings from the live feeds — Scholarships Corner, Opportunities Corner, Scholars4Dev and Opportunities for Youth. New listings land straight in the board.",
  },
  {
    keys: ["cv", "matcher", "resume", "match"],
    answer: "CV Matcher scores your CV against every listing and ranks the best-fit opportunities. It works without a Gemini key using the built-in heuristic scorer — a key just upgrades it.",
  },
  {
    keys: ["deadline", "due", "countdown", "urgent", "soon"],
    answer: "Every dated card shows a live countdown pill — amber inside 7 days, coral when overdue. The Deadline column header sorts soonest-first.",
  },
  {
    keys: ["track", "pipeline", "kanban", "status"],
    answer: "Hit Track on any listing and it lands in your Pipeline. Drag cards between columns — Applied → Screening → Interview → Offer — and it saves automatically.",
  },
  {
    keys: ["research", "institute", "program"],
    answer: "The Research tab shows institute programs by default — Mitacs, CERN, EPFL, Max Planck and more. Flip to Company R&D to see corporate research roles.",
  },
  {
    keys: ["scholarship", "funded", "money", "financial"],
    answer: "The Scholarships tab covers Bachelor, Master and PhD funding — UCL, Warwick, Rhodes, Gates Cambridge, MEXT, GKS and more.",
  },
  {
    keys: ["country", "countries", "location"],
    answer: "Filter by country from the dropdown on the board, or browse the Countries page — every country card deep-links to its own filtered board.",
  },
];

// Radar Buddy — the site's single mascot. A cream creature wearing a radar
// antenna with a pulsing blip, dressed only in the site palette (cream +
// signal green) so it blends with the logo and the light theme. Blinks and
// its pupils follow the cursor on mouse devices.
function BuddyFace({ size = 52 }: { size?: number }) {
  const leftPupil = useRef<SVGCircleElement>(null);
  const rightPupil = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (e: MouseEvent) => {
      const dx = (e.clientX / window.innerWidth - 0.5) * 4;
      const dy = (e.clientY / window.innerHeight - 0.5) * 4;
      const tx = Math.max(-2.2, Math.min(2.2, dx));
      const ty = Math.max(-2.2, Math.min(2.2, dy));
      leftPupil.current?.setAttribute("transform", `translate(${tx} ${ty})`);
      rightPupil.current?.setAttribute("transform", `translate(${tx} ${ty})`);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" role="img" aria-label="Radar Buddy assistant">
      {/* soft green disc */}
      <circle cx="32" cy="32" r="30" fill="#16A34A" />
      <circle cx="32" cy="32" r="26" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeDasharray="3 4" />

      {/* radar antenna + pulsing blip */}
      <g className="buddy-antenna">
        <line x1="44" y1="13" x2="48.5" y2="7" stroke="#15803D" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="48.5" cy="5.5" r="2.6" fill="#BBF7D0" className="buddy-blip" />
      </g>

      {/* cream blob body */}
      <path
        d="M32 12 C42 10 51 17 51.5 27 C52 37 45 47 35 49.5 C25 52 15 47 12.5 37.5 C10 28 15 19 23 14.5 C25.5 13 29 13 32 12 Z"
        fill="#FDFBF2"
      />
      <ellipse cx="21.5" cy="21.5" rx="5" ry="3.2" fill="#FFFFFF" opacity="0.55" transform="rotate(-18 21.5 21.5)" />

      {/* eyes (blink) + cursor-following pupils */}
      <g className="assistant-eyes">
        <circle cx="26" cy="30" r="2.6" fill="#1B1B1F" />
        <circle cx="39" cy="30" r="2.6" fill="#1B1B1F" />
        <circle ref={leftPupil} cx="26.7" cy="29.2" r="0.95" fill="#FFFFFF" />
        <circle ref={rightPupil} cx="39.7" cy="29.2" r="0.95" fill="#FFFFFF" />
      </g>

      {/* smile */}
      <path d="M29.5 35.5 Q32.5 38.5 35.5 35.5" stroke="#1B1B1F" strokeWidth="1.4" strokeLinecap="round" fill="none" />

      {/* green cheeks — blend with the accent, no pink */}
      <circle cx="20.5" cy="34.5" r="2.6" fill="#BBF7D0" opacity="0.95" />
      <circle cx="43.5" cy="34.5" r="2.6" fill="#BBF7D0" opacity="0.95" />
    </svg>
  );
}

// A radar blip — the game's collectible. Ring + dot, all green.
function BlipIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#16A34A" strokeWidth="1.6" strokeOpacity="0.5" />
      <circle cx="12" cy="12" r="4.5" fill="#16A34A" />
      <circle cx="9.5" cy="9.5" r="1.3" fill="#BBF7D0" opacity="0.9" />
    </svg>
  );
}

interface Msg {
  from: "user" | "assistant";
  text: string;
}

const GAME_SECONDS = 20;

interface Blip {
  id: number;
  left: number;
  duration: number;
}

function GameView({ hopKey, onHop }: { hopKey: number; onHop: () => void }) {
  const [state, setState] = useState<"idle" | "playing" | "done">("idle");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [blips, setBlips] = useState<Blip[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    if (state !== "playing") return;
    const tick = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    const spawn = setInterval(() => {
      setBlips((c) => [
        ...c,
        { id: ++idRef.current, left: 8 + Math.random() * 78, duration: 1.6 + Math.random() * 0.9 },
      ]);
    }, 620);
    return () => {
      clearInterval(tick);
      clearInterval(spawn);
    };
  }, [state]);

  useEffect(() => {
    if (state === "playing" && timeLeft === 0) {
      setState("done");
      setBlips([]);
    }
  }, [timeLeft, state]);

  // Remove blips that reached the bottom uncaught.
  useEffect(() => {
    const timers = blips.map((c) => setTimeout(() => {
      setBlips((all) => all.filter((x) => x.id !== c.id));
    }, c.duration * 1000 + 60));
    return () => timers.forEach(clearTimeout);
  }, [blips]);

  const catchIt = (id: number) => {
    setBlips((all) => all.filter((x) => x.id !== id));
    setScore((s) => s + 1);
    onHop();
  };

  const start = () => {
    setScore(0);
    setTimeLeft(GAME_SECONDS);
    setBlips([]);
    setState("playing");
  };

  return (
    <div className="px-4 pb-4">
      <div className="relative h-48 rounded-xl border border-hairline overflow-hidden bg-gradient-to-b from-accent/[0.05] to-accent/[0.02]">
        {/* falling blips */}
        {state === "playing" &&
          blips.map((c) => (
            <div key={c.id} className="absolute top-0" style={{ left: `${c.left}%` }}>
              <button
                onClick={() => catchIt(c.id)}
                aria-label="Catch the blip"
                className="blip-fall block cursor-pointer hover:scale-110 transition-transform"
                style={{ animationDuration: `${c.duration}s` }}
              >
                <BlipIcon />
              </button>
            </div>
          ))}

        {/* buddy — hops when it catches a blip */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
          <div key={hopKey} className={hopKey > 0 ? "buddy-hop" : undefined}>
            <BuddyFace size={56} />
          </div>
        </div>

        {/* score / timer */}
        {state !== "idle" && (
          <div className="absolute top-2 inset-x-2 flex items-center justify-between font-mono text-[11px] font-bold">
            <span className="rounded-full bg-white/80 border border-hairline px-2.5 py-1 text-accent tabular-nums">
              ◎ {score}
            </span>
            <span className={clsx("rounded-full px-2.5 py-1 border tabular-nums", timeLeft <= 5 && state === "playing" ? "bg-coralSoft text-coral border-coral/40" : "bg-white/80 border-hairline text-inkDim")}>
              {timeLeft}s
            </span>
          </div>
        )}

        {/* overlay states */}
        {state === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6">
            <p className="font-display font-bold text-base text-ink">Catch the blips!</p>
            <p className="text-xs text-inkDim">Tap the falling radar blips before they hit the ground. {GAME_SECONDS}s on the clock.</p>
            <button onClick={start} className="duo-btn mt-1 px-4 py-2 text-sm bg-accent text-white hover:bg-accentBright">
              <Play size={13} /> Start
            </button>
          </div>
        )}
        {state === "done" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6">
            <p className="font-display font-bold text-base text-ink">You caught {score} blip{score === 1 ? "" : "s"}!</p>
            <p className="text-xs text-inkDim">{score >= 15 ? "Radar overload — nothing gets past you. ◎" : score >= 8 ? "Sharp reflexes — the antenna approves." : "Keep practicing — blips wait for no one."}</p>
            <button onClick={start} className="duo-btn mt-1 px-4 py-2 text-sm bg-accent text-white hover:bg-accentBright">
              <RotateCcw size={13} /> Play again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Assistant() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"chat" | "play">("chat");
  const [q, setQ] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [hopKey, setHopKey] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open, tab]);

  const go = (params: string) => {
    router.push(`/board?${params}`);
    setOpen(false);
  };

  const ask = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    const hit = FAQ.find((f) => f.keys.some((k) => lower.includes(k)));
    setMsgs((m) => [
      ...m,
      { from: "user", text: trimmed },
      {
        from: "assistant",
        text: hit?.answer ?? "I can point you to filters instead — try one of the quick actions above, or ask me about sync, deadlines, the CV matcher, tracking, or scholarships.",
      },
    ]);
    setQ("");
  };

  return (
    <>
      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Radar Buddy assistant"
          className="fixed bottom-20 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-hairline bg-surface shadow-2xl flex flex-col overflow-hidden"
          onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-hairline bg-accent/[0.04]">
            <BuddyFace size={34} />
            <div className="min-w-0">
              <p className="font-display font-bold text-base text-ink leading-tight">Radar Buddy</p>
              <p className="font-mono text-[10px] text-inkDim uppercase tracking-[0.14em]">always on · no API key</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="ml-auto p-1.5 rounded-lg text-inkFaint hover:text-ink hover:bg-accent/[0.06] transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 px-4 pt-3">
            <button
              onClick={() => setTab("chat")}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                tab === "chat" ? "bg-accent/10 text-accent" : "text-inkFaint hover:text-ink"
              )}
            >
              <MessageSquare size={12} /> Chat
            </button>
            <button
              onClick={() => setTab("play")}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                tab === "play" ? "bg-accent/10 text-accent" : "text-inkFaint hover:text-ink"
              )}
            >
              <Gamepad2 size={12} /> Play
            </button>
          </div>

          {tab === "chat" ? (
            <>
              {/* Chat / quick actions */}
              <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2 max-h-60">
                {msgs.length === 0 ? (
                  <p className="text-xs text-inkDim leading-relaxed">
                    Ask me about the site — or jump straight to a filtered board with a quick action.
                  </p>
                ) : (
                  msgs.map((m, i) => (
                    <div
                      key={i}
                      className={clsx(
                        "text-xs leading-relaxed rounded-xl px-3 py-2 max-w-[85%]",
                        m.from === "user"
                          ? "ml-auto bg-accent text-white"
                          : "bg-accent/[0.06] border border-hairline text-ink"
                      )}
                    >
                      {m.text}
                    </div>
                  ))
                )}
              </div>

              {/* Quick actions */}
              <div className="px-4 pb-3 grid grid-cols-2 gap-1.5">
                {ACTIONS.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => go(a.params)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-hairline text-inkDim hover:text-ink hover:border-accent/40 hover:bg-accent/[0.05] transition-colors text-left"
                  >
                    {a.label} <ArrowRight size={11} className="ml-auto opacity-60" />
                  </button>
                ))}
              </div>

              {/* Ask */}
              <div className="px-4 pb-4 flex items-center gap-2 border-t border-hairline pt-3">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") ask(q); }}
                  placeholder="Ask about sync, deadlines, CV…"
                  aria-label="Ask the assistant"
                  className="input !py-2 !text-xs flex-1"
                />
                <button
                  onClick={() => ask(q)}
                  aria-label="Send"
                  className="duo-btn shrink-0 !px-3 !py-2 bg-accent text-white hover:bg-accentBright"
                >
                  <Send size={13} />
                </button>
              </div>
            </>
          ) : (
            <GameView hopKey={hopKey} onHop={() => setHopKey((h) => h + 1)} />
          )}
        </div>
      )}

      {/* Floating buddy — one mascot, blends with the logo */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close Radar Buddy" : "Open Radar Buddy"}
        aria-expanded={open}
        title="Radar Buddy"
        className="fixed bottom-5 right-4 sm:right-6 z-50 group outline-none"
      >
        <span className={clsx("block rounded-full shadow-lg transition-transform duration-200 group-hover:scale-[1.06] group-focus-visible:ring-2 ring-accent/70 ring-offset-2 ring-offset-base", hopKey > 0 && "buddy-hop")}>
          <BuddyFace size={52} />
        </span>
        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-leaf border-2 border-base" />
      </button>
    </>
  );
}
