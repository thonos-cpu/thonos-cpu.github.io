import { after } from "next/server";
import { z } from "zod";

import { deleteExpiredAnalytics, recordAnalyticsEvent } from "@/lib/analytics";
import { analyticsEnabled } from "@/lib/database";
import { clientIp, rateLimit, safeJsonHeaders } from "@/lib/security";

export const runtime = "nodejs";

const schema = z.object({
  sessionId: z.string().uuid(),
  eventType: z.enum(["page_view", "section_view", "heartbeat", "duration"]),
  path: z.string().min(1).max(240),
  section: z.string().max(120).optional(),
  durationSeconds: z.number().int().min(0).max(86_400).optional(),
  referrer: z.string().max(1_000).optional(),
  deviceClass: z.enum(["mobile", "tablet", "desktop"]).optional(),
});

export async function POST(request: Request) {
  if (!analyticsEnabled()) return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  const ip = clientIp(request);
  const limit = rateLimit(`analytics:${ip}`, 180, 60_000);
  if (!limit.ok) return Response.json({ error: "Rate limit reached." }, { status: 429, headers: safeJsonHeaders({ "Retry-After": String(limit.retryAfter) }) });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.path.startsWith("/admin")) return Response.json({ error: "Invalid event." }, { status: 400, headers: safeJsonHeaders() });
  try {
    await recordAnalyticsEvent(request, parsed.data);
    if (Math.random() < .005) after(() => deleteExpiredAnalytics());
    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error(JSON.stringify({ level: "error", message: "analytics_event_failed", error: error instanceof Error ? error.message : String(error) }));
    return Response.json({ error: "Analytics storage unavailable." }, { status: 503, headers: safeJsonHeaders() });
  }
}
