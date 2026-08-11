import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Assistant from "@/components/Assistant";

// Wondering's type system: one clean sans (Inter) for both display headings
// and body/UI text — weight contrast does the work. JetBrains Mono stays for
// the data/ledger voice (dates, counts, statuses) — Radar's own accent.
// --font-display aliases --font-body in globals.css, so headings share the
// same loaded family without a second font download.
const body = Inter({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600", "700", "800"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "Radar — Opportunities, Research & Summer Schools",
  description: "Live internships, research programs, fully funded summer schools and scholarships — ranked fresh, deadlines counted down.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${mono.variable}`}>
      <body>
        <NavBar />
        <main className="mx-auto max-w-[1200px] px-5 sm:px-8 py-10 lg:py-12">{children}</main>
        <Assistant />
      </body>
    </html>
  );
}
