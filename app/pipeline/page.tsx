"use client";

import { useEffect, useMemo, useState } from "react";
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import { Search, ExternalLink, DollarSign, Calendar, Sparkles } from "lucide-react";
import clsx from "clsx";

type Status = "APPLIED" | "SCREENING" | "INTERVIEW" | "OFFER" | "REJECTED";

interface Application {
  id: string;
  company: string;
  role: string;
  status: Status;
  salaryRange?: string | null;
  jobLink?: string | null;
  appliedDate: string;
  notes?: string | null;
  order: number;
  cvMatch?: { matchScore: number } | null;
}

// Status colors follow the classic green/yellow/red learning palette:
// applied = neutral, screening = blue, interview = yellow, offer = green,
// rejected = red.
const COLUMNS: { key: Status; label: string; dot: string; count: string }[] = [
  { key: "APPLIED", label: "Applied", dot: "bg-white/25", count: "text-inkDim" },
  { key: "SCREENING", label: "Screening", dot: "bg-sky", count: "text-sky" },
  { key: "INTERVIEW", label: "Interview", dot: "bg-sun", count: "text-sun" },
  { key: "OFFER", label: "Offer", dot: "bg-leaf", count: "text-leaf" },
  { key: "REJECTED", label: "Rejected", dot: "bg-coral", count: "text-coral" },
];

export default function PipelinePage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(q?: string) {
    setLoading(true);
    const res = await fetch(`/api/applications${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    const data = await res.json();
    setApps(data.applications || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(query || undefined), 300);
    return () => clearTimeout(t);
  }, [query]);

  const byColumn = useMemo(() => {
    const map: Record<Status, Application[]> = {
      APPLIED: [], SCREENING: [], INTERVIEW: [], OFFER: [], REJECTED: [],
    };
    for (const a of apps) map[a.status].push(a);
    for (const key of Object.keys(map) as Status[]) map[key].sort((a, b) => a.order - b.order);
    return map;
  }, [apps]);

  async function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus = destination.droppableId as Status;

    // optimistic local update
    setApps((prev) => {
      const moved = prev.find((a) => a.id === draggableId);
      if (!moved) return prev;
      const rest = prev.filter((a) => a.id !== draggableId);
      const updated = { ...moved, status: newStatus, order: destination.index };
      return [...rest, updated];
    });

    // status (and thus column) saves automatically
    await fetch(`/api/applications/${draggableId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, order: destination.index }),
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-ink mb-0.5">Application Pipeline</h1>
          <p className="text-inkDim text-sm">Drag cards across columns as your status changes — it saves automatically.</p>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-inkDim" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company, role, notes…"
            className="input !w-64 pl-8"
          />
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {COLUMNS.map((col) => (
            <div key={col.key} className="card rounded-lg overflow-hidden">
              <div className="px-3 py-2.5 flex items-center gap-2 border-b border-hairline bg-white/[0.02]">
                <span className={clsx("w-2.5 h-2.5 rounded-full shrink-0", col.dot)} />
                <span className="font-display font-bold text-sm text-ink">{col.label}</span>
                <span className={clsx("ml-auto font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-paper", col.count)}>
                  {byColumn[col.key].length}
                </span>
              </div>
              <Droppable droppableId={col.key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={clsx(
                      "p-2 min-h-[120px] space-y-2 transition-colors",
                      snapshot.isDraggingOver && "bg-accent/[0.06]"
                    )}
                  >
                    {byColumn[col.key].map((app, index) => (
                      <Draggable key={app.id} draggableId={app.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={clsx(
                              "bg-surface rounded-lg border border-hairline p-3 cursor-grab active:cursor-grabbing hover:border-white/20 transition-colors duration-200",
                              snapshot.isDragging && "ring-1 ring-accent border-accent/70"
                            )}
                          >
                            <div className="font-display font-bold text-sm text-ink">{app.company}</div>
                            <div className="text-xs text-inkDim mb-2">{app.role}</div>
                            <div className="flex flex-col gap-1 text-xs text-inkDim font-mono">
                              {app.salaryRange && (
                                <span className="flex items-center gap-1"><DollarSign size={11} />{app.salaryRange}</span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar size={11} />
                                {new Date(app.appliedDate).toLocaleDateString()}
                              </span>
                            </div>
                            {app.notes && (
                              <p className="text-xs text-inkDim mt-2 line-clamp-2">{app.notes}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-hairline">
                              {app.jobLink && (
                                <a
                                  href={app.jobLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-bold text-sky flex items-center gap-1 hover:text-[#7DD3FC] transition-colors"
                                >
                                  <ExternalLink size={11} /> Job
                                </a>
                              )}
                              <a
                                href={`/cv-match?applicationId=${app.id}`}
                                className="text-xs font-bold text-inkFaint flex items-center gap-1 hover:text-ink transition-colors"
                                title="Run the AI CV matcher against this application"
                              >
                                <Sparkles size={11} /> Match
                              </a>
                              {app.cvMatch && (
                                <span
                                  className="ml-auto text-xs font-bold text-leaf bg-leafSoft border border-leaf/30 px-2 py-0.5 rounded-full"
                                  title={`Saved match score: ${app.cvMatch.matchScore}%`}
                                >
                                  {app.cvMatch.matchScore}%
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {!loading && byColumn[col.key].length === 0 && (
                      <p className="text-xs text-inkDim text-center py-6">No cards here yet.</p>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
