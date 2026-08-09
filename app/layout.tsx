import type { Metadata } from "next";
import { Space_Grotesk, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";

const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space", weight: ["500", "600", "700"] });
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken", weight: ["400", "500", "600", "700"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "Radar — Opportunities, Research & Summer Schools",
  description: "Live internships, research programs, fully funded summer schools and scholarships — ranked fresh, deadlines counted down.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${space.variable} ${hanken.variable} ${mono.variable}`}>
      <body>
        <NavBar />
        <main className="mx-auto max-w-[1200px] px-5 sm:px-8 py-10 lg:py-12">{children}</main>
      </body>
    </html>
  );
}
