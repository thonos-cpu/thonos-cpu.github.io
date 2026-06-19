import { createClient } from "npm:@supabase/supabase-js@2";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function configuredOrigins(): Set<string> {
  return new Set((Deno.env.get("ALLOWED_ORIGINS") || "https://tasis.info,https://www.tasis.info,http://localhost:3000,http://127.0.0.1:3000")
    .split(",").map((origin) => origin.trim()).filter(Boolean));
}

function originAllowed(origin: string): boolean {
  if (configuredOrigins().has(origin)) return true;
  try {
    const hostname = new URL(origin).hostname;
    const suffixes = (Deno.env.get("ALLOWED_ORIGIN_SUFFIXES") || ".vercel.app")
      .split(",").map((suffix) => suffix.trim().toLowerCase()).filter(Boolean);
    return suffixes.some((suffix) => hostname.endsWith(suffix) && hostname.length > suffix.length);
  } catch {
    return false;
  }
}

export function corsHeaders(request: Request): HeadersInit | null {
  const origin = request.headers.get("origin");
  if (!origin) return {};
  if (!originAllowed(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-analytics-session",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function preflight(request: Request): Response | null {
  if (request.method !== "OPTIONS") return null;
  const headers = corsHeaders(request);
  return new Response(null, { status: headers ? 204 : 403, headers: headers || {} });
}

export function json(request: Request, body: unknown, status = 200, extra: HeadersInit = {}): Response {
  const cors = corsHeaders(request);
  return new Response(JSON.stringify(body), {
    status: cors ? status : 403,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...(cors || {}), ...extra },
  });
}

export function serviceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) throw new Error("Supabase service credentials are unavailable.");
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let value = "";
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(normalized), (character) => character.charCodeAt(0));
}

async function hmac(value: string): Promise<string> {
  const salt = Deno.env.get("ANALYTICS_HASH_SALT");
  if (!salt || salt.length < 32) throw new Error("ANALYTICS_HASH_SALT must contain at least 32 characters.");
  const key = await crypto.subtle.importKey("raw", encoder.encode(salt), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return bytesToBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))));
}

export async function visitorHash(request: Request): Promise<string> {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  return hmac(`${forwarded}|${userAgent}`);
}

export async function consumeRateLimit(request: Request, scope: string, limit: number, windowSeconds: number): Promise<boolean> {
  const fingerprint = await visitorHash(request);
  const keyHash = await hmac(`${scope}|${fingerprint}`);
  const { data, error } = await serviceClient().rpc("consume_portfolio_rate_limit", {
    p_key_hash: keyHash,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) throw error;
  return data === true;
}

export async function verifyTurnstile(request: Request, token: unknown): Promise<boolean> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret || typeof token !== "string" || token.length < 10 || token.length > 2048) return false;
  const remoteip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
  const body = new URLSearchParams({ secret, response: token, remoteip });
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) return false;
  const result = await response.json() as { success?: boolean };
  return result.success === true;
}

const secretPatterns: Array<[RegExp, string]> = [
  [/sk-[A-Za-z0-9_-]{20,}/g, "[REDACTED_OPENAI_KEY]"],
  [/(?:ghp|github_pat)_[A-Za-z0-9_]{20,}/g, "[REDACTED_GITHUB_TOKEN]"],
  [/AKIA[0-9A-Z]{16}/g, "[REDACTED_AWS_KEY]"],
  [/Bearer\s+[A-Za-z0-9._~+/-]{16,}/gi, "Bearer [REDACTED]"],
  [/((?:password|secret|api[_-]?key|token)\s*[:=]\s*)[^\s,;]+/gi, "$1[REDACTED]"],
];

function redactValue(value: unknown): unknown {
  if (typeof value === "string") return secretPatterns.reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), value);
  if (Array.isArray(value)) return value.map(redactValue);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, redactValue(item)]));
  return value;
}

async function encryptionKey(): Promise<CryptoKey> {
  const encoded = Deno.env.get("ANALYTICS_ENCRYPTION_KEY");
  if (!encoded) throw new Error("ANALYTICS_ENCRYPTION_KEY is missing.");
  const raw = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
  if (raw.length !== 32) throw new Error("ANALYTICS_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptPayload(payload: Record<string, unknown>): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = encoder.encode(JSON.stringify(redactValue(payload)));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await encryptionKey(), plaintext);
  return `v1.${bytesToBase64Url(iv)}.${bytesToBase64Url(new Uint8Array(encrypted))}`;
}

export async function decryptPayload(value: string): Promise<Record<string, unknown>> {
  const [version, ivValue, encryptedValue] = value.split(".");
  if (version !== "v1" || !ivValue || !encryptedValue) throw new Error("Unsupported encrypted payload.");
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64UrlToBytes(ivValue) },
    await encryptionKey(),
    base64UrlToBytes(encryptedValue),
  );
  return JSON.parse(decoder.decode(decrypted)) as Record<string, unknown>;
}

export async function storeSensitiveLog(input: {
  sessionId?: string | null;
  kind: "gpt" | "compiler";
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const sessionId = input.sessionId && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.sessionId)
    ? input.sessionId : null;
  const { error } = await serviceClient().from("analytics_sensitive_logs").insert({
    session_id: sessionId,
    kind: input.kind,
    encrypted_payload: await encryptPayload(input.payload),
    metadata: input.metadata || {},
  });
  if (error) throw error;
}
