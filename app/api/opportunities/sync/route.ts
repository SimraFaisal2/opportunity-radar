import { NextResponse } from "next/server";
import { syncAllFeeds } from "@/lib/rss-sync";

// Fetches 4 RSS feeds (15s timeout each) — longer than Vercel's default 10s
// Hobby-plan limit, so allow up to 60s. Ignored by local `next dev`.
export const maxDuration = 60;

// POST /api/opportunities/sync  -> triggered by the "Sync" button
export async function POST() {
  try {
    const results = await syncAllFeeds();
    return NextResponse.json({ ok: true, results });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
