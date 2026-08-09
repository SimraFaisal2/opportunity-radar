import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSessionToken, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/auth";

// POST /api/auth/login — verify credentials and start a session
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // Same message for unknown email vs wrong password — don't leak which one.
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  const res = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
  res.cookies.set(SESSION_COOKIE, createSessionToken(user.id), SESSION_COOKIE_OPTIONS);
  return res;
}
