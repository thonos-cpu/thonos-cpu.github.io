import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { consumeRateLimit, corsHeaders, json, preflight, serviceClient, visitorHash } from "../_shared/common.ts";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const eventTypes = new Set(["page_view", "section_view", "heartbeat", "duration"]);

Deno.serve(async (request) => {
  const options = preflight(request);
  if (options) return options;
  if (request.method !== "POST") return json(request, { error: "Method not allowed." }, 405);
  if (!corsHeaders(request)) return json(request, { error: "Origin not allowed." }, 403);

  try {
    if (!await consumeRateLimit(request, "analytics", 180, 60)) return json(request, { error: "Rate limit reached." }, 429);
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
    const eventType = typeof body?.eventType === "string" ? body.eventType : "";
    const path = typeof body?.path === "string" && body.path.startsWith("/") ? body.path.slice(0, 240) : "";
    if (!uuid.test(sessionId) || !eventTypes.has(eventType) || !path || path.startsWith("/admin")) {
      return json(request, { error: "Invalid analytics event." }, 400);
    }

    const section = typeof body?.section === "string" ? body.section.slice(0, 120) : null;
    const duration = Math.min(Math.max(Math.round(Number(body?.durationSeconds || 0)), 0), 86400);
    const deviceClass = ["mobile", "tablet", "desktop"].includes(String(body?.deviceClass)) ? String(body?.deviceClass) : null;
    let referrer: string | null = null;
    if (typeof body?.referrer === "string" && body.referrer) {
      try {
        const value = new URL(body.referrer);
        referrer = `${value.protocol}//${value.host}${value.pathname}`.slice(0, 500);
      } catch { /* Invalid referrers are discarded. */ }
    }
    const countryHeader = request.headers.get("cf-ipcountry") || request.headers.get("x-country-code");
    const country = countryHeader && /^[a-z]{2}$/i.test(countryHeader) ? countryHeader.toUpperCase() : null;

    const client = serviceClient();
    const { error } = await client.rpc("record_portfolio_analytics", {
      p_session_id: sessionId,
      p_visitor_hash: await visitorHash(request),
      p_event_type: eventType,
      p_path: path,
      p_section: section,
      p_duration_seconds: duration,
      p_referrer: referrer,
      p_device_class: deviceClass,
      p_country_code: country,
    });
    if (error) throw error;

    if (Math.random() < 0.005) {
      EdgeRuntime.waitUntil(client.rpc("delete_expired_portfolio_data", {
        p_analytics_days: Number(Deno.env.get("ANALYTICS_RETENTION_DAYS") || 730),
        p_sensitive_days: Number(Deno.env.get("SENSITIVE_LOG_RETENTION_DAYS") || 30),
      }));
    }
    return new Response(null, { status: 204, headers: { ...(corsHeaders(request) || {}), "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("analytics_ingest_failed", error);
    return json(request, { error: "Analytics storage is unavailable." }, 503);
  }
});
