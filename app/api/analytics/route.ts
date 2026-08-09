import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/analytics
export async function GET() {
  const applications = await prisma.application.findMany({
    select: { status: true, appliedDate: true },
  });

  const total = applications.length;

  const byStatus: Record<string, number> = {
    APPLIED: 0, SCREENING: 0, INTERVIEW: 0, OFFER: 0, REJECTED: 0,
  };
  for (const a of applications) byStatus[a.status]++;

  // Conversion: applications that ever reached INTERVIEW or later (INTERVIEW + OFFER) / total
  const reachedInterview = byStatus.INTERVIEW + byStatus.OFFER;
  const conversionRate = total > 0 ? Math.round((reachedInterview / total) * 1000) / 10 : 0;

  // applications over time — bucket by month (YYYY-MM) of appliedDate
  const monthly: Record<string, number> = {};
  for (const a of applications) {
    const d = new Date(a.appliedDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthly[key] = (monthly[key] || 0) + 1;
  }
  const timeline = Object.entries(monthly)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([month, count]) => ({ month, count }));

  return NextResponse.json({
    total,
    byStatus,
    conversionRate,
    timeline,
  });
}
