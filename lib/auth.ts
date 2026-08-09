import crypto from "crypto";
import type { NextRequest } from "next/server";
import { prisma } from "./prisma";

// Lightweight auth with ZERO new dependencies (the project deliberately avoids
// native modules — they break installs on Node 24 + Windows). Password hashing
// uses Node's built-in scrypt; sessions are stateless HMAC-signed tokens
// (payload.signature) stored in an httpOnly cookie.
//
// The signing secret comes from AUTH_SECRET in .env. A dev fallback keeps the
// app runnable if the variable is missing, but you should set a real one.

export const SESSION_COOKIE = "mc_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const SCRYPT_KEYLEN = 64;

function getSecret(): string {
  return process.env.AUTH_SECRET || "dev-insecure-secret-change-me";
}

// ---------------------------------------------------------------------------
// Password hashing (scrypt, per-user random salt)
// ---------------------------------------------------------------------------

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  const expected = Buffer.from(hash, "hex");
  return (
    candidate.length === expected.length &&
    crypto.timingSafeEqual(candidate, expected)
  );
}

// ---------------------------------------------------------------------------
// Stateless sessions: base64url(payload).hmac — verified by recomputing
// the signature, with an expiry check. No server-side session table needed.
// ---------------------------------------------------------------------------

export function createSessionToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, exp: Date.now() + SESSION_TTL_MS })
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string): string | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data.uid || typeof data.exp !== "number" || data.exp < Date.now()) {
      return null;
    }
    return data.uid as string;
  } catch {
    return null;
  }
}

export async function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const uid = verifySessionToken(token);
  if (!uid) return null;
  return prisma.user.findUnique({ where: { id: uid } });
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days, seconds
};
