import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/applications?q=search+term
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();

  const applications = await prisma.application.findMany({
    where: q
      ? {
          OR: [
            { company: { contains: q } },
            { role: { contains: q } },
            { notes: { contains: q } },
          ],
        }
      : undefined,
    orderBy: [{ status: "asc" }, { order: "asc" }],
    include: { cvMatch: true, opportunity: true },
  });

  return NextResponse.json({ applications });
}

// POST /api/applications
// Body: either { opportunityId } to "+ Track" a listing, or a full manual entry
export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.opportunityId) {
    // "+ Track" flow: pull details from the Opportunity into a new Application
    const opp = await prisma.opportunity.findUnique({ where: { id: body.opportunityId } });
    if (!opp) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });

    const existing = await prisma.application.findUnique({ where: { opportunityId: opp.id } });
    if (existing) return NextResponse.json({ application: existing });

    const application = await prisma.application.create({
      data: {
        company: opp.company,
        role: opp.title,
        jobLink: opp.applyUrl,
        deadline: opp.deadline, // inherit the listing's deadline so it shows on the calendar
        opportunityId: opp.id,
        status: "APPLIED",
      },
    });
    return NextResponse.json({ application });
  }

  // Manual entry (e.g. calendar quick-add, or applications not sourced from the feed)
  const application = await prisma.application.create({
    data: {
      company: body.company,
      role: body.role,
      salaryRange: body.salaryRange,
      jobLink: body.jobLink,
      deadline: body.deadline ? new Date(body.deadline) : undefined,
      appliedDate: body.appliedDate ? new Date(body.appliedDate) : new Date(),
      notes: body.notes,
      status: body.status || "APPLIED",
    },
  });
  return NextResponse.json({ application });
}
