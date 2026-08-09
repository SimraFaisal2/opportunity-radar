import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/auth";

// POST /api/auth/register — create an account and start a session
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: { email, passwordHash: hashPassword(password), name: name || null },
  });

  const res = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
  res.cookies.set(SESSION_COOKIE, createSessionToken(user.id), SESSION_COOKIE_OPTIONS);
  return res;
}
