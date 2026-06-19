import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export function redactSecrets(value: string): string {
  return value
    .replace(/\bsk-[a-zA-Z0-9_-]{16,}\b/g, "[REDACTED]")
    .replace(/\bgh[pousr]_[a-zA-Z0-9]{20,}\b/g, "[REDACTED]")
    .replace(/\bAKIA[A-Z0-9]{16}\b/g, "[REDACTED]")
    .replace(/\b(Bearer\s+)[a-zA-Z0-9._-]{16,}\b/gi, "$1[REDACTED]")
    .replace(/\b(password|passwd|secret|api[_-]?key|token)\s*[:=]\s*[^\s,;]+/gi, "$1=[REDACTED]");
}

function encryptionKey(): Buffer {
  const encoded = process.env.ANALYTICS_ENCRYPTION_KEY;
  if (!encoded) throw new Error("ANALYTICS_ENCRYPTION_KEY is missing.");
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) throw new Error("ANALYTICS_ENCRYPTION_KEY must decode to exactly 32 bytes.");
  return key;
}

export function encryptAnalyticsPayload(payload: Record<string, unknown>): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const plaintext = JSON.stringify(payload, (_key, value) => typeof value === "string" ? redactSecrets(value) : value);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptAnalyticsPayload(value: string): Record<string, unknown> {
  const [version, ivValue, tagValue, encryptedValue] = value.split(".");
  if (version !== "v1" || !ivValue || !tagValue || !encryptedValue) throw new Error("Unsupported encrypted payload.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(encryptedValue, "base64url")), decipher.final()]).toString("utf8");
  return JSON.parse(plaintext) as Record<string, unknown>;
}
