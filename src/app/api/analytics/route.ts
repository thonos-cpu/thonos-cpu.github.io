import { consumeRateLimit, noStoreJson, recordAnalytics } from "@/lib/server-security";

export const runtime = "nodejs";
export const maxDuration = 10;

export async function POST(request: Request) {
  try {
    if (!await consumeRateLimit(request, "analytics", 180, 60)) return noStoreJson({ error: "Rate limit reached." }, 429);
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!body) return noStoreJson({ error: "Invalid analytics event." }, 400);
    await recordAnalytics(request, body);
    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof TypeError) return noStoreJson({ error: error.message }, 400);
    console.error("analytics_failed", error);
    return noStoreJson({ error: "Analytics storage is unavailable." }, 503);
  }
}
