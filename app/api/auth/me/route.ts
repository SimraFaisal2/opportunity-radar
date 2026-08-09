import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/auth/me — who is the current visitor? { user: {...} | null }
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  return NextResponse.json({
    user: user ? { id: user.id, email: user.email, name: user.name } : null,
  });
}
