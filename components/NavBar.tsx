"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Radar, KanbanSquare, CalendarDays, BarChart3, FileSearch, LogOut, MapPinned } from "lucide-react";
import clsx from "clsx";
import { useEffect, useState } from "react";
import Logo from "./Logo";

const links = [
  { href: "/board", label: "Opportunities", icon: Radar },
  { href: "/countries", label: "Countries", icon: MapPinned },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/cv-match", label: "CV Matcher", icon: FileSearch },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/calendar", label: "Deadlines", icon: CalendarDays },
];

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

export default function NavBar() {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checked, setChecked] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Re-check the session whenever the route changes (covers login/register
  // redirects without a full page reload).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setUser(d.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }

  const initials = (user?.name || user?.email || "?")
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header
      className={clsx(
        "sticky top-0 z-40 backdrop-blur-xl transition-colors duration-300",
        scrolled ? "bg-base/90 border-b border-hairline" : "bg-base/60 border-b border-transparent"
      )}
    >
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8 h-16 flex items-center gap-6">
        <Link href="/board" className="shrink-0 flex items-center gap-2.5 group">
          <Logo size={30} className="transition-transform duration-200 group-hover:scale-[1.04]" />
          <span className="font-display font-bold tracking-tight text-[16px] text-ink">
            Radar<span className="text-accent">.</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-colors duration-200",
                  active
                    ? "bg-accent/[0.08] text-ink"
                    : "text-inkFaint hover:text-ink hover:bg-accent/[0.05]"
                )}
              >
                <Icon size={14} className={active ? "text-accent" : undefined} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          {checked && !user && (
            <>
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-lg text-[13px] font-semibold text-inkFaint hover:text-ink hover:bg-accent/[0.05] transition-colors duration-200"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="btn-primary !py-1.5 !px-3.5 text-[13px]"
              >
                Sign up
              </Link>
            </>
          )}
          {checked && user && (
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center border border-accent/30">
                {initials}
              </span>
              <span className="hidden md:block text-[13px] font-semibold text-ink max-w-[140px] truncate">
                {user.name || user.email}
              </span>
              <button
                onClick={handleSignOut}
                title="Sign out"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-inkFaint hover:text-ink hover:bg-accent/[0.05] transition-colors duration-200"
              >
                <LogOut size={13} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
