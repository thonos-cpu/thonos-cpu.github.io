import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { consumeRateLimit, corsHeaders, json, preflight, storeSensitiveLog, verifyTurnstile } from "../_shared/common.ts";

const runtimes: Record<string, string> = {
  python: "python", javascript: "javascript", typescript: "typescript", java: "java", c: "c", cpp: "c++",
  rust: "rust", go: "go", csharp: "csharp", kotlin: "kotlin", swift: "swift", php: "php", ruby: "ruby", bash: "bash", lua: "lua",
};

Deno.serve(async (request) => {
  const options = preflight(request);
  if (options) return options;
  if (request.method !== "POST") return json(request, { error: "Method not allowed." }, 405);
  if (!corsHeaders(request)) return json(request, { error: "Origin not allowed." }, 403);
  try {
    if (!await consumeRateLimit(request, "execute", 8, 60)) return json(request, { error: "Execution limit reached. Try again shortly." }, 429);
    const body = await request.json().catch(() => null) as { language?: unknown; code?: unknown; turnstileToken?: unknown; sessionId?: unknown } | null;
    const language = typeof body?.language === "string" ? body.language : "";
    const code = typeof body?.code === "string" ? body.code : "";
    if (!runtimes[language] || !code || code.length > 20000) return json(request, { error: "Invalid execution request." }, 400);
    if (!await verifyTurnstile(request, body?.turnstileToken)) return json(request, { error: "Human verification is required." }, 403);

    const endpoint = (Deno.env.get("PISTON_API_URL") || "https://emkc.org/api/v2/piston").replace(/\/$/, "");
    const response = await fetch(`${endpoint}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: runtimes[language], version: "*", files: [{ name: "main", content: code }], stdin: "", args: [],
        compile_timeout: 5000, run_timeout: 5000, compile_memory_limit: 256000000, run_memory_limit: 256000000,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`Executor returned ${response.status}`);
    const result = await response.json() as { compile?: { output?: string }; run?: { output?: string; stderr?: string; signal?: string; code?: number } };
    const output = [result.compile?.output, result.run?.output || result.run?.stderr].filter(Boolean).join("\n").slice(0, 12000);

    await storeSensitiveLog({
      sessionId: typeof body?.sessionId === "string" ? body.sessionId : null,
      kind: "compiler",
      payload: { language, source: code },
      metadata: { sourceBytes: new TextEncoder().encode(code).length, exitCode: result.run?.code ?? null },
    });
    return json(request, { output, exitCode: result.run?.code ?? null, signal: result.run?.signal ?? null });
  } catch (error) {
    console.error("execute_failed", error);
    return json(request, { error: "The execution sandbox is unavailable right now." }, 502);
  }
});
