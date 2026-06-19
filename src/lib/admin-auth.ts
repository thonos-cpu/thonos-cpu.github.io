import "server-only";

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "tasis_admin";
const SESSION_SECONDS = 60 * 60 * 12;

function sessionSecret(): string {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("ADMIN_SESSION_SECRET must contain at least 32 characters.");
  return value;
}

function signature(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function verifyAdminPassword(password: string): boolean {
  const stored = process.env.ADMIN_PASSWORD_HASH;
  if (!stored) return false;
  const [scheme, saltValue, hashValue] = stored.split(".");
  if (scheme !== "scrypt" || !saltValue || !hashValue) return false;
  const expected = Buffer.from(hashValue, "base64url");
  const actual = scryptSync(password, Buffer.from(saltValue, "base64url"), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function createAdminToken(username: string): string {
  const payload = Buffer.from(JSON.stringify({
    username,
    expiresAt: Date.now() + SESSION_SECONDS * 1000,
    nonce: randomBytes(12).toString("base64url"),
  })).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export function verifyAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, suppliedSignature] = token.split(".");
  if (!payload || !suppliedSignature) return false;
  const expectedSignature = signature(payload);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return false;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { username?: string; expiresAt?: number };
    return parsed.username === process.env.ADMIN_USERNAME && typeof parsed.expiresAt === "number" && parsed.expiresAt > Date.now();
  } catch {
    return false;
  }
}

export async function setAdminSession(username: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, createAdminToken(username), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.VERCEL_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, "", { httpOnly: true, sameSite: "strict", secure: process.env.VERCEL_ENV === "production", path: "/", maxAge: 0 });
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  try {
    return verifyAdminToken(store.get(COOKIE_NAME)?.value);
  } catch {
    return false;
  }
}
