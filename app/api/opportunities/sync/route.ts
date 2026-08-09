import { NextResponse } from "next/server";
import { syncAllFeeds } from "@/lib/rss-sync";

// POST /api/opportunities/sync  -> triggered by the "Sync" button
export async function POST() {
  try {
    const results = await syncAllFeeds();
    return NextResponse.json({ ok: true, results });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
