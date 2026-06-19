import "server-only";

import type { DashboardData, DashboardPeriod } from "@/lib/analytics";

export function getDemoDashboardData(period: DashboardPeriod): DashboardData {
  const points = period === "day" ? 18 : period === "month" ? 20 : 12;
  const step = period === "day" ? 60 * 60 * 1000 : period === "month" ? 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
  const series = Array.from({ length: points }, (_, index) => ({
    bucket: new Date(Date.now() - (points - index - 1) * step),
    views: 8 + ((index * 7) % 26) + (index % 4 === 0 ? 12 : 0),
    visitors: 5 + ((index * 5) % 17),
  }));
  return {
    summary: { live_visitors: 3, unique_visitors: 842, sessions: 1086, page_views: 1634, avg_duration: 214, total_duration: 232404 },
    series,
    topPages: [
      { path: "/", views: 1462, avg_seconds: 238 },
      { path: "/privacy", views: 92, avg_seconds: 61 },
      { path: "/projects/tfidf-search-engine", views: 80, avg_seconds: 183 },
    ],
    topSections: [
      { section: "top", views: 1462 },
      { section: "work", views: 1188 },
      { section: "repository-archive", views: 904 },
      { section: "lab", views: 631 },
      { section: "thanosgpt", views: 588 },
      { section: "contact", views: 342 },
    ],
    sensitive: [
      { id: 1, kind: "gpt", payload: { question: "What did Athanasios build with distributed systems?", answer: "A Chord-style distributed hash table with consistent hashing and replication." }, metadata: { outcome: "answered" }, occurredAt: new Date(Date.now() - 8 * 60_000) },
      { id: 2, kind: "compiler", payload: { language: "python", source: "values = [3, 8, 13, 21]\nprint(sum(values))" }, metadata: { sourceBytes: 48 }, occurredAt: new Date(Date.now() - 42 * 60_000) },
    ],
  };
}
