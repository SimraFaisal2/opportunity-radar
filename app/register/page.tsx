"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, UserRound, Flame, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Try again.");
        setBusy(false);
        return;
      }
      router.push("/board");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-8">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <Link href="/board" className="flex items-center gap-2.5 group">
            <Logo size={38} className="transition-transform duration-200 group-hover:scale-[1.04]" />
            <span className="font-display font-bold tracking-tight text-xl text-ink">
              Radar<span className="text-accent">.</span>
            </span>
          </Link>
        </div>

        <div className="card p-7">
          <h1 className="font-display font-bold text-2xl tracking-tight text-ink mb-1">Create your account</h1>
          <p className="text-sm text-inkDim mb-5">Sign up free — your pipeline, deadlines, and matches stay local.</p>

          {error && (
            <div className="mb-4 bg-coralSoft border border-coral/40 rounded-lg px-3 py-2 text-sm text-coral font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block">
              <span className="text-xs font-semibold text-inkDim uppercase tracking-wide">Name (optional)</span>
              <div className="mt-1 flex items-center gap-2 bg-[#0E0E0E] border border-hairline rounded-lg px-3 focus-within:border-accent/70 transition-colors">
                <UserRound size={15} className="text-inkFaint shrink-0" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex"
                  className="w-full bg-transparent py-2.5 text-sm text-ink placeholder:text-inkFaint outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-inkDim uppercase tracking-wide">Email</span>
              <div className="mt-1 flex items-center gap-2 bg-[#0E0E0E] border border-hairline rounded-lg px-3 focus-within:border-accent/70 transition-colors">
                <Mail size={15} className="text-inkFaint shrink-0" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-transparent py-2.5 text-sm text-ink placeholder:text-inkFaint outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-inkDim uppercase tracking-wide">Password</span>
              <div className="mt-1 flex items-center gap-2 bg-[#0E0E0E] border border-hairline rounded-lg px-3 focus-within:border-accent/70 transition-colors">
                <Lock size={15} className="text-inkFaint shrink-0" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8+ characters"
                  className="w-full bg-transparent py-2.5 text-sm text-ink placeholder:text-inkFaint outline-none"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={busy}
              className="duo-btn duo-btn-green w-full py-3 text-base mt-2"
            >
              {busy ? "Creating account…" : "Create account"}
              {!busy && <ArrowRight size={16} />}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-inkDim mt-5">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-accent hover:text-accentBright transition-colors">
            Log in
          </Link>
        </p>

        <p className="flex items-center justify-center gap-1 text-xs text-inkFaint mt-6">
          <Flame size={12} /> Free — no credit card, no streaks lost.
        </p>
      </div>
    </div>
  );
}
