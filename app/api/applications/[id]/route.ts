import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/applications/:id
// Used by the CV matcher to resolve an application's linked opportunity
// (for prefilling the job description) without pulling the whole list.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const application = await prisma.application.findUnique({
    where: { id: params.id },
    include: { cvMatch: true, opportunity: true },
  });
  if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });
  return NextResponse.json({ application });
}

// PATCH /api/applications/:id
// Used by the Kanban board for drag-and-drop status changes, and for editing
// notes/salary/etc. Body is a partial update.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();

  const application = await prisma.application.update({
    where: { id: params.id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.order !== undefined && { order: body.order }),
      ...(body.company !== undefined && { company: body.company }),
      ...(body.role !== undefined && { role: body.role }),
      ...(body.salaryRange !== undefined && { salaryRange: body.salaryRange }),
      ...(body.jobLink !== undefined && { jobLink: body.jobLink }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.deadline !== undefined && { deadline: body.deadline ? new Date(body.deadline) : null }),
      ...(body.appliedDate !== undefined && { appliedDate: new Date(body.appliedDate) }),
    },
  });

  return NextResponse.json({ application });
}

// DELETE /api/applications/:id
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.application.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
