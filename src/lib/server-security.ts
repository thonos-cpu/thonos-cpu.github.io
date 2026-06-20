import "server-only";

import { createCipheriv, createHmac, randomBytes } from "node:crypto";

import { getSupabaseServerClient } from "@/lib/supabase-server";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const secretPatterns: Array<[RegExp, string]> = [
  [/(?:ghp|github_pat)_[A-Za-z0-9_]{20,}/g, "[REDACTED_GITHUB_TOKEN]"],
  [/Bearer\s+[A-Za-z0-9._~+/-]{16,}/gi, "Bearer [REDACTED]"],
  [/((?:password|secret|api[_-]?key|token)\s*[:=]\s*)[^\s,;]+/gi, "$1[REDACTED]"],
];

function hmac(value: string): string {
  const salt = process.env.ANALYTICS_HASH_SALT;
  if (!salt || salt.length < 32) throw new Error("ANALYTICS_HASH_SALT must contain at least 32 characters.");
  return createHmac("sha256", salt).update(value).digest("base64url");
}

function clientFingerprint(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return hmac(`${forwarded}|${request.headers.get("user-agent") || "unknown"}`);
}

export async function consumeRateLimit(request: Request, scope: string, limit: number, windowSeconds: number): Promise<boolean> {
  const { data, error } = await getSupabaseServerClient().rpc("consume_portfolio_rate_limit", {
    p_key_hash: hmac(`${scope}|${clientFingerprint(request)}`),
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) throw error;
  return data === true;
}

function redact(value: unknown): unknown {
  if (typeof value === "string") return secretPatterns.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, redact(item)]));
  return value;
}

function encrypt(payload: Record<string, unknown>): string {
  const encoded = process.env.ANALYTICS_ENCRYPTION_KEY;
  if (!encoded) throw new Error("ANALYTICS_ENCRYPTION_KEY is missing.");
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) throw new Error("ANALYTICS_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(redact(payload)), "utf8"), cipher.final()]);
  return `v1.${iv.toString("base64url")}.${Buffer.concat([encrypted, cipher.getAuthTag()]).toString("base64url")}`;
}

export async function storeSensitiveLog(input: {
  sessionId?: string | null;
  kind: "gpt" | "compiler";
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { error } = await getSupabaseServerClient().from("analytics_sensitive_logs").insert({
    session_id: input.sessionId && uuid.test(input.sessionId) ? input.sessionId : null,
    kind: input.kind,
    encrypted_payload: encrypt(input.payload),
    metadata: input.metadata || {},
  });
  if (error) throw error;
}

export async function recordAnalytics(request: Request, body: Record<string, unknown>): Promise<void> {
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  const eventType = typeof body.eventType === "string" ? body.eventType : "";
  const path = typeof body.path === "string" && body.path.startsWith("/") ? body.path.slice(0, 240) : "";
  if (!uuid.test(sessionId) || !["page_view", "section_view", "heartbeat", "duration"].includes(eventType) || !path || path.startsWith("/admin")) {
    throw new TypeError("Invalid analytics event.");
  }
  let referrer: string | null = null;
  if (typeof body.referrer === "string" && body.referrer) {
    try {
      const value = new URL(body.referrer);
      referrer = `${value.protocol}//${value.host}${value.pathname}`.slice(0, 500);
    } catch { /* Discard malformed referrers. */ }
  }
  const countryHeader = request.headers.get("x-vercel-ip-country");
  const { error } = await getSupabaseServerClient().rpc("record_portfolio_analytics", {
    p_session_id: sessionId,
    p_visitor_hash: clientFingerprint(request),
    p_event_type: eventType,
    p_path: path,
    p_section: typeof body.section === "string" ? body.section.slice(0, 120) : null,
    p_duration_seconds: Math.min(Math.max(Math.round(Number(body.durationSeconds || 0)), 0), 86400),
    p_referrer: referrer,
    p_device_class: ["mobile", "tablet", "desktop"].includes(String(body.deviceClass)) ? String(body.deviceClass) : null,
    p_country_code: countryHeader && /^[a-z]{2}$/i.test(countryHeader) ? countryHeader.toUpperCase() : null,
  });
  if (error) throw error;
}

export function noStoreJson(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
