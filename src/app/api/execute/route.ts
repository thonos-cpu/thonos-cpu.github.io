import { after } from "next/server";
import { z } from "zod";

import { recordSensitiveInteraction } from "@/lib/analytics";
import { clientIp, rateLimit, safeJsonHeaders, verifyTurnstile } from "@/lib/security";

export const runtime = "nodejs";
export const maxDuration = 10;

const runtimeNames: Record<string, string> = {
  python: "python",
  javascript: "javascript",
  typescript: "typescript",
  java: "java",
  c: "c",
  cpp: "c++",
  rust: "rust",
  go: "go",
  csharp: "csharp",
  kotlin: "kotlin",
  swift: "swift",
  php: "php",
  ruby: "ruby",
  bash: "bash",
  lua: "lua",
};

const payloadSchema = z.object({
  language: z.enum(["python", "javascript", "typescript", "java", "c", "cpp", "rust", "go", "csharp", "kotlin", "swift", "php", "ruby", "bash", "lua"]),
  code: z.string().min(1).max(20_000),
  turnstileToken: z.string().max(2048).optional(),
});

export async function POST(request: Request) {
  const started = Date.now();
  const ip = clientIp(request);
  const limit = rateLimit(`execute:${ip}`, 8, 60_000);
  if (!limit.ok) {
    return Response.json({ error: "Execution limit reached. Try again shortly." }, { status: 429, headers: safeJsonHeaders({ "Retry-After": String(limit.retryAfter) }) });
  }

  const parsed = payloadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid execution request." }, { status: 400, headers: safeJsonHeaders() });
  if (!await verifyTurnstile(parsed.data.turnstileToken, request)) {
    return Response.json({ error: "Human verification is required." }, { status: 403, headers: safeJsonHeaders() });
  }

  const sessionId = request.headers.get("x-analytics-session");
  after(() => recordSensitiveInteraction({
    sessionId,
    kind: "compiler",
    payload: { language: parsed.data.language, source: parsed.data.code },
    metadata: { sourceBytes: Buffer.byteLength(parsed.data.code, "utf8") },
  }).catch(() => undefined));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7_000);
  try {
    const endpoint = (process.env.PISTON_API_URL || "https://emkc.org/api/v2/piston").replace(/\/$/, "");
    const response = await fetch(`${endpoint}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: runtimeNames[parsed.data.language],
        version: "*",
        files: [{ name: "main", content: parsed.data.code }],
        stdin: "",
        args: [],
        compile_timeout: 5_000,
        run_timeout: 5_000,
        compile_memory_limit: 256_000_000,
        run_memory_limit: 256_000_000,
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Executor returned ${response.status}`);
    const result = await response.json() as { compile?: { output?: string }; run?: { output?: string; stderr?: string; signal?: string; code?: number } };
    const output = [result.compile?.output, result.run?.output || result.run?.stderr].filter(Boolean).join("\n").slice(0, 12_000);
    console.log(JSON.stringify({ level: "info", message: "execute_done", language: parsed.data.language, duration_ms: Date.now() - started }));
    return Response.json({ output, exitCode: result.run?.code ?? null, signal: result.run?.signal ?? null }, { headers: safeJsonHeaders() });
  } catch (error) {
    console.error(JSON.stringify({ level: "error", message: "execute_failed", duration_ms: Date.now() - started, error: error instanceof Error ? error.message : String(error) }));
    return Response.json({ error: "The execution sandbox is unavailable right now. Your source was not stored." }, { status: 502, headers: safeJsonHeaders() });
  } finally {
    clearTimeout(timeout);
  }
}
