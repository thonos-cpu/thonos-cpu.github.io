import "server-only";

import { createHmac } from "node:crypto";
import type { JSONValue } from "postgres";

import { decryptAnalyticsPayload, encryptAnalyticsPayload } from "@/lib/analytics-crypto";
import { analyticsEnabled, getSql } from "@/lib/database";
import { clientIp } from "@/lib/security";

export type AnalyticsEventInput = {
  sessionId: string;
  eventType: "page_view" | "section_view" | "heartbeat" | "duration";
  path: string;
  section?: string;
  durationSeconds?: number;
  referrer?: string;
  deviceClass?: "mobile" | "tablet" | "desktop";
};

function visitorHash(request: Request): string {
  const salt = process.env.ANALYTICS_HASH_SALT;
  if (!salt) throw new Error("ANALYTICS_HASH_SALT is missing.");
  const identity = `${clientIp(request)}|${request.headers.get("user-agent") || "unknown"}`;
  return createHmac("sha256", salt).update(identity).digest("hex");
}

function safePath(value: string): string {
  const path = value.startsWith("/") ? value : "/";
  return path.slice(0, 240);
}

function safeReferrer(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}${url.pathname}`.slice(0, 500);
  } catch {
    return null;
  }
}

export async function recordAnalyticsEvent(request: Request, event: AnalyticsEventInput): Promise<void> {
  if (!analyticsEnabled()) return;
  const sql = getSql();
  const path = safePath(event.path);
  const duration = Math.min(Math.max(Math.round(event.durationSeconds || 0), 0), 86_400);
  const country = request.headers.get("x-vercel-ip-country")?.slice(0, 2).toUpperCase() || null;

  await sql.begin(async (transaction) => {
    await transaction`
      INSERT INTO analytics_sessions (
        session_id, visitor_hash, entry_path, exit_path, referrer, device_class, country_code,
        started_at, first_seen, last_seen, duration_seconds, page_views
      ) VALUES (
        ${event.sessionId}, ${visitorHash(request)}, ${path}, ${path}, ${safeReferrer(event.referrer)},
        ${event.deviceClass || null}, ${country}, NOW(), NOW(), NOW(), ${duration},
        ${event.eventType === "page_view" ? 1 : 0}
      )
      ON CONFLICT (session_id) DO UPDATE SET
        last_seen = NOW(),
        exit_path = ${path},
        device_class = COALESCE(analytics_sessions.device_class, EXCLUDED.device_class),
        country_code = COALESCE(analytics_sessions.country_code, EXCLUDED.country_code),
        duration_seconds = GREATEST(analytics_sessions.duration_seconds, ${duration}),
        ended_at = CASE WHEN ${event.eventType} = 'duration' THEN NOW() ELSE analytics_sessions.ended_at END,
        page_views = analytics_sessions.page_views + CASE WHEN ${event.eventType} = 'page_view' THEN 1 ELSE 0 END
    `;
    await transaction`
      INSERT INTO analytics_events (session_id, event_type, path, section, duration_seconds)
      VALUES (${event.sessionId}, ${event.eventType}, ${path}, ${event.section?.slice(0, 120) || null}, ${duration || null})
    `;
  });
}

export async function recordSensitiveInteraction(input: {
  sessionId?: string | null;
  kind: "gpt" | "compiler";
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!analyticsEnabled()) return;
  const sql = getSql();
  const sessionId = input.sessionId && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.sessionId)
    ? input.sessionId : null;
  await sql`
    INSERT INTO analytics_sensitive_logs (session_id, kind, encrypted_payload, metadata)
    VALUES (${sessionId}, ${input.kind}, ${encryptAnalyticsPayload(input.payload)}, ${sql.json((input.metadata || {}) as JSONValue)})
  `;
}

export type DashboardPeriod = "day" | "month" | "year" | "all";

export type DashboardData = {
  summary: { live_visitors: number; unique_visitors: number; sessions: number; page_views: number; avg_duration: number; total_duration: number };
  series: { bucket: Date; views: number; visitors: number }[];
  topPages: { path: string; views: number; avg_seconds: number }[];
  topSections: { section: string; views: number }[];
  sensitive: { id: number; kind: "gpt" | "compiler"; payload: Record<string, unknown>; metadata: Record<string, unknown>; occurredAt: Date }[];
};

function periodStart(period: DashboardPeriod): Date {
  const now = new Date();
  if (period === "day") return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (period === "month") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (period === "year") return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  return new Date(0);
}

export async function getDashboardData(period: DashboardPeriod): Promise<DashboardData> {
  const sql = getSql();
  const since = periodStart(period);
  const bucket = period === "day" ? "hour" : period === "month" ? "day" : "month";

  const [summary] = await sql<{
    live_visitors: number; unique_visitors: number; sessions: number; page_views: number; avg_duration: number; total_duration: number;
  }[]>`
    SELECT
      (SELECT COUNT(*)::int FROM analytics_sessions WHERE last_seen > NOW() - INTERVAL '2 minutes') AS live_visitors,
      COUNT(DISTINCT visitor_hash)::int AS unique_visitors,
      COUNT(*)::int AS sessions,
      COALESCE(SUM(page_views), 0)::int AS page_views,
      COALESCE(AVG(duration_seconds), 0)::int AS avg_duration,
      COALESCE(SUM(duration_seconds), 0)::int AS total_duration
    FROM analytics_sessions WHERE first_seen >= ${since}
  `;

  const [series, topPages, topSections, sensitiveRows] = await Promise.all([
    sql<{ bucket: Date; views: number; visitors: number }[]>`
      SELECT date_trunc(${bucket}, e.occurred_at) AS bucket,
        COUNT(*) FILTER (WHERE e.event_type = 'page_view')::int AS views,
        COUNT(DISTINCT s.visitor_hash)::int AS visitors
      FROM analytics_events e
      JOIN analytics_sessions s ON s.session_id = e.session_id
      WHERE e.occurred_at >= ${since}
      GROUP BY 1 ORDER BY 1 ASC
    `,
    sql<{ path: string; views: number; avg_seconds: number }[]>`
      SELECT page_views.path, page_views.views, COALESCE(durations.avg_seconds, 0)::int AS avg_seconds
      FROM (
        SELECT path, COUNT(*)::int AS views FROM analytics_events
        WHERE event_type = 'page_view' AND occurred_at >= ${since}
        GROUP BY path
      ) page_views
      LEFT JOIN (
        SELECT path, AVG(duration_seconds)::int AS avg_seconds FROM analytics_events
        WHERE event_type = 'duration' AND occurred_at >= ${since}
        GROUP BY path
      ) durations ON durations.path = page_views.path
      ORDER BY page_views.views DESC LIMIT 12
    `,
    sql<{ section: string; views: number }[]>`
      SELECT section, COUNT(*)::int AS views FROM analytics_events
      WHERE event_type = 'section_view' AND section IS NOT NULL AND occurred_at >= ${since}
      GROUP BY section ORDER BY views DESC LIMIT 12
    `,
    sql<{ id: number; kind: "gpt" | "compiler"; encrypted_payload: string; metadata: Record<string, unknown>; occurred_at: Date }[]>`
      SELECT id, kind, encrypted_payload, metadata, occurred_at
      FROM analytics_sensitive_logs WHERE occurred_at >= ${since}
      ORDER BY occurred_at DESC LIMIT 100
    `,
  ]);

  const sensitive = sensitiveRows.map((row) => {
    try {
      return { id: row.id, kind: row.kind, payload: decryptAnalyticsPayload(row.encrypted_payload), metadata: row.metadata, occurredAt: row.occurred_at };
    } catch {
      return { id: row.id, kind: row.kind, payload: { error: "Unable to decrypt this record." }, metadata: row.metadata, occurredAt: row.occurred_at };
    }
  });

  return { summary, series, topPages, topSections, sensitive };
}

export async function deleteExpiredAnalytics(): Promise<void> {
  if (!analyticsEnabled()) return;
  const sql = getSql();
  const analyticsDays = Math.max(Number(process.env.ANALYTICS_RETENTION_DAYS || 730), 30);
  const sensitiveDays = Math.max(Number(process.env.SENSITIVE_LOG_RETENTION_DAYS || 30), 1);
  await sql.begin(async (transaction) => {
    await transaction`DELETE FROM analytics_sensitive_logs WHERE occurred_at < NOW() - (${sensitiveDays} * INTERVAL '1 day')`;
    await transaction`DELETE FROM analytics_sessions WHERE first_seen < NOW() - (${analyticsDays} * INTERVAL '1 day')`;
  });
}
