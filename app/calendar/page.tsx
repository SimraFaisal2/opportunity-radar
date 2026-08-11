"use client";

import { useEffect, useMemo, useState } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  format, isSameMonth, isSameDay, addMonths, subMonths, parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight, ExternalLink, X, Clock, CalendarCheck, AlertTriangle } from "lucide-react";
import clsx from "clsx";

interface Application {
  id: string;
  company: string;
  role: string;
  status: string;
  jobLink?: string | null;
  appliedDate: string;
  deadline?: string | null;
  notes?: string | null;
}

interface Opportunity {
  id: string;
  company: string;
  title: string;
  deadline?: string | null;
  degree: string;
  type: string;
  countries: string;
  applyUrl: string;
  sourceFeed: string;
  application?: { id: string } | null; // linked Application, when already tracked
}

// A calendar event is either a tracked application or a live opportunity
// deadline. Both render as chips on the day they matter.
interface CalendarEvent {
  id: string;
  company: string;
  role: string;
  status: string;
  jobLink?: string | null;
  appliedDate?: string | null;
  deadline?: string | null;
  notes?: string | null;
  isOpportunity: boolean;
  kind: string; // for opportunities: INTERNSHIP / SCHOLARSHIP / ...
}

export default function CalendarPage() {
  const [month, setMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [quickAdd, setQuickAdd] = useState({ company: "", role: "", jobLink: "", deadline: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    const [appsRes, oppsRes] = await Promise.all([
      fetch("/api/applications"),
      fetch("/api/opportunities"),
    ]);
    const [appsData, oppsData] = await Promise.all([appsRes.json(), oppsRes.json()]);

    const appEvents: CalendarEvent[] = (appsData.applications || []).map((a: Application) => ({
      id: a.id,
      company: a.company,
      role: a.role,
      status: a.status,
      jobLink: a.jobLink ?? null,
      appliedDate: a.appliedDate,
      deadline: a.deadline ?? null,
      notes: a.notes ?? null,
      isOpportunity: false,
      kind: "APPLICATION",
    }));

    const oppEvents: CalendarEvent[] = (oppsData.opportunities || [])
      // Skip listings that are already tracked — those show up as application
      // chips (and the /api/opportunities response includes the link).
      .filter((o: Opportunity) => o.deadline && !o.application)
      .map((o: Opportunity) => ({
        id: o.id,
        company: o.company,
        role: o.title,
        status: o.type,
        jobLink: o.applyUrl,
        deadline: o.deadline,
        isOpportunity: true,
        kind: o.type,
      }));

    setEvents([...appEvents, ...oppEvents]);
  }

  useEffect(() => {
    load();
  }, []);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  // Normalize an ISO date to local noon on its UTC calendar day, so a stored
  // midnight-UTC deadline (e.g. 2026-08-28T00:00:00.000Z) lands on Aug 28 in
  // every timezone instead of shifting a day early.
  function dayDate(iso: string) {
    const d = new Date(iso);
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0);
  }

  // A card sits on its deadline day if one is set, otherwise on the day it was
  // applied — so the board always shows the next thing that needs attention.
  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of events) {
      const date = ev.deadline ? dayDate(ev.deadline) : ev.appliedDate ? dayDate(ev.appliedDate) : null;
      if (!date) continue;
      const key = format(date, "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    }
    return map;
  }, [events]);

  // The 6 soonest deadlines, newest-aware: overdue first (red), then within 7
  // days (amber), then the rest (green). "Soonest" = closest to today.
  const soonest = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return events
      .filter((ev) => ev.deadline)
      .map((ev) => {
        const deadline = dayDate(ev.deadline!);
        const daysLeft = Math.floor((deadline.getTime() - today.getTime()) / 86400000);
        return { ev, deadline, daysLeft };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 6);
  }, [events]);

  function urgency(daysLeft: number) {
    if (daysLeft < 0) return { label: "Overdue", chip: "bg-coralSoft text-coral border border-coral/40", text: "text-coral" };
    if (daysLeft === 0) return { label: "Due today", chip: "bg-coralSoft text-coral border border-coral/40", text: "text-coral" };
    if (daysLeft <= 3) return { label: `${daysLeft}d left`, chip: "bg-sunSoft text-sun border border-sun/40", text: "text-sun" };
    if (daysLeft <= 7) return { label: `${daysLeft}d left`, chip: "bg-sunSoft text-sun border border-sun/40", text: "text-sun" };
    return { label: `${daysLeft}d left`, chip: "bg-leafSoft text-leaf border border-leaf/30", text: "text-leaf" };
  }

  // Convert a yyyy-MM-dd date input into a timezone-safe Date (noon local time
  // avoids the UTC-midnight date-shift when the string round-trips through JSON).
  function toIso(dateStr: string) {
    if (!dateStr) return undefined;
    return new Date(`${dateStr}T12:00:00`).toISOString();
  }

  async function handleQuickAdd() {
    if (!selectedDate || !quickAdd.company.trim() || !quickAdd.role.trim()) return;
    setSaving(true);
    await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company: quickAdd.company,
        role: quickAdd.role,
        jobLink: quickAdd.jobLink || undefined,
        deadline: toIso(quickAdd.deadline),
        appliedDate: selectedDate.toISOString(),
      }),
    });
    setSaving(false);
    setSelectedDate(null);
    setQuickAdd({ company: "", role: "", jobLink: "", deadline: "" });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-ink mb-0.5">Deadline Calendar</h1>
          <p className="text-inkDim text-sm">
            Yellow = the real deadline; gray = applied date when no deadline is set. Click a date to quick-add.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMonth((m) => subMonths(m, 1))} className="p-1.5 rounded-lg border border-hairline text-inkFaint hover:text-ink hover:bg-accent/5 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="font-bold text-sm text-ink w-32 text-center">{format(month, "MMMM yyyy")}</span>
          <button onClick={() => setMonth((m) => addMonths(m, 1))} className="p-1.5 rounded-lg border border-hairline text-inkFaint hover:text-ink hover:bg-accent/5 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4 text-xs text-inkDim font-bold">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sun inline-block" /> Deadline</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-black/25 inline-block" /> Applied date</span>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5 items-start">
        <div className="grid grid-cols-7 gap-px bg-hairline/50 rounded-xl overflow-hidden border border-hairline">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="bg-accent/[0.04] text-center text-xs text-inkDim py-2 font-bold">{d}</div>
          ))}
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDay[key] || [];
            const inMonth = isSameMonth(day, month);
            const isToday = isSameDay(day, new Date());
            return (
              <div
                key={key}
                onClick={() => setSelectedDate(day)}
                className={clsx(
                  "bg-white min-h-[92px] p-1.5 cursor-pointer hover:bg-accent/[0.05] transition-colors",
                  !inMonth && "opacity-40"
                )}
              >
                <div className={clsx("text-xs mb-1 font-mono", isToday ? "text-accent font-bold" : "text-inkDim")}>
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map((ev) => {
                    const hasDeadline = !!ev.deadline;
                    return (
                      <button
                        key={ev.id}
                        onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                        className={clsx(
                          "w-full text-left text-[10px] rounded-md px-1 py-0.5 truncate text-ink hover:border-accent flex items-center gap-1 transition-colors",
                          ev.isOpportunity
                            ? "bg-sunSoft border border-sun/40 hover:border-sun"
                            : "bg-accent/[0.04] border border-hairline hover:border-accent"
                        )}
                      >
                        <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", hasDeadline ? "bg-sun" : "bg-black/25")} />
                        <span className="truncate">{ev.company}</span>
                      </button>
                    );
                  })}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] text-inkDim px-1">+{dayEvents.length - 2} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Due soonest panel */}
        <div className="card p-5 sticky top-24">
          <h2 className="font-display font-bold text-lg text-ink mb-0.5 flex items-center gap-1.5">
            <AlertTriangle size={16} className="text-sun" /> Due soonest
          </h2>
          <p className="text-xs text-inkDim font-bold mb-3">Next 6 deadlines from today, {format(new Date(), "MMM d, yyyy")}</p>
          <div className="space-y-2">
            {soonest.length === 0 && (
              <p className="text-sm text-inkDim">No deadlines yet — track an opportunity to see it here.</p>
            )}
            {soonest.map(({ ev, deadline, daysLeft }) => {
              const u = urgency(daysLeft);
              return (
                <button
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className="w-full text-left bg-accent/[0.04] border border-hairline hover:border-sun/50 rounded-lg px-3 py-2 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-sm font-extrabold text-ink truncate">{ev.company}</span>
                    <span className={clsx("shrink-0 text-[10px] font-extrabold px-2 py-0.5 rounded-full", u.chip)}>{u.label}</span>
                  </div>
                  <div className="text-xs text-inkDim truncate mb-1">{ev.role}</div>
                  <div className="flex items-center justify-between">
                    <span className={clsx("text-[10px] font-mono font-bold", u.text)}>
                      {format(deadline, "MMM d, yyyy")}
                    </span>
                    <span className="text-[10px] font-bold text-inkDim uppercase tracking-wide">
                      {ev.isOpportunity ? ev.kind.replace("_", " ") : ev.status}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick-add modal */}
      {selectedDate && !selectedEvent && (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-sm flex items-center justify-center z-30 p-4" onClick={() => setSelectedDate(null)}>
          <div className="bg-white border border-hairline shadow-2xl rounded-xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold text-lg text-ink">Quick-add · {format(selectedDate, "MMM d, yyyy")}</h2>
              <button onClick={() => setSelectedDate(null)} className="text-inkDim hover:text-ink"><X size={16} /></button>
            </div>
            <div className="space-y-2">
              <input
                placeholder="Company"
                value={quickAdd.company}
                onChange={(e) => setQuickAdd({ ...quickAdd, company: e.target.value })}
                className="w-full bg-white border border-hairline rounded-lg px-3 py-2 text-sm text-ink placeholder:text-inkFaint focus:border-accent/70 outline-none transition-colors"
              />
              <input
                placeholder="Role"
                value={quickAdd.role}
                onChange={(e) => setQuickAdd({ ...quickAdd, role: e.target.value })}
                className="w-full bg-white border border-hairline rounded-lg px-3 py-2 text-sm text-ink placeholder:text-inkFaint focus:border-accent/70 outline-none transition-colors"
              />
              <input
                placeholder="Job link (optional)"
                value={quickAdd.jobLink}
                onChange={(e) => setQuickAdd({ ...quickAdd, jobLink: e.target.value })}
                className="w-full bg-white border border-hairline rounded-lg px-3 py-2 text-sm text-ink placeholder:text-inkFaint focus:border-accent/70 outline-none transition-colors"
              />
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-sm text-inkDim font-bold shrink-0">
                  <CalendarCheck size={14} /> Deadline
                </label>
                <input
                  type="date"
                  value={quickAdd.deadline}
                  onChange={(e) => setQuickAdd({ ...quickAdd, deadline: e.target.value })}
                  className="w-full bg-white border border-hairline rounded-lg px-3 py-2 text-sm text-ink focus:border-accent/70 outline-none transition-colors"
                />
              </div>
            </div>
            <button
              onClick={handleQuickAdd}
              disabled={saving}
              className="duo-btn duo-btn-green w-full mt-3 text-sm"
            >
              {saving ? "Adding…" : "Add application"}
            </button>
          </div>
        </div>
      )}

      {/* Event detail modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-sm flex items-center justify-center z-30 p-4" onClick={() => { setSelectedEvent(null); setSelectedDate(null); }}>
          <div className="bg-white border border-hairline shadow-2xl rounded-xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold text-lg text-ink">{selectedEvent.company}</h2>
              <button onClick={() => { setSelectedEvent(null); setSelectedDate(null); }} className="text-inkDim hover:text-ink"><X size={16} /></button>
            </div>
            <p className="text-sm text-inkDim mb-1">{selectedEvent.role}</p>
            <p className="text-xs font-mono text-inkDim mb-1">
              {selectedEvent.isOpportunity ? `Type: ${selectedEvent.status.replace("_", " ")}` : `Status: ${selectedEvent.status}`}
            </p>
            <div className="flex flex-col gap-1 text-xs font-mono text-inkDim mb-3">
              {selectedEvent.deadline ? (
                <span className="flex items-center gap-1.5 text-sun font-bold">
                  <CalendarCheck size={12} /> Deadline {format(dayDate(selectedEvent.deadline), "MMM d, yyyy")}
                </span>
              ) : selectedEvent.appliedDate ? (
                <span className="flex items-center gap-1.5">
                  <Clock size={12} /> Applied {format(dayDate(selectedEvent.appliedDate), "MMM d, yyyy")}
                </span>
              ) : null}
            </div>
            {selectedEvent.notes && <p className="text-sm text-inkDim mb-3">{selectedEvent.notes}</p>}
            {selectedEvent.jobLink && (
              <a
                href={selectedEvent.jobLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-bold text-sky hover:text-[#0369A1] hover:underline transition-colors"
              >
                {selectedEvent.isOpportunity ? "Open apply link" : "Open job link"} <ExternalLink size={13} />
              </a>
            )}
            {selectedEvent.isOpportunity && (
              <div className="mt-3">
                <button
                  onClick={async () => {
                    // "+Track" flow: the route pulls company/role/link/deadline
                    // from the Opportunity and links it, so re-tracking the same
                    // listing just returns the existing application.
                    const res = await fetch("/api/applications", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ opportunityId: selectedEvent.id }),
                    });
                    if (res.ok) {
                      setSelectedEvent(null);
                      load();
                    }
                  }}
                  className="duo-btn duo-btn-green w-full text-sm"
                >
                  Track this opportunity
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
