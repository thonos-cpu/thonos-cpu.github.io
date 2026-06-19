import { Activity, Clock3, Database, Eye, LogOut, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardAutoRefresh } from "@/components/dashboard-auto-refresh";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getDashboardData, type DashboardPeriod } from "@/lib/analytics";
import { getDemoDashboardData } from "@/lib/analytics-demo";
import { analyticsEnabled, DatabaseConfigurationError } from "@/lib/database";

export const dynamic = "force-dynamic";

const periods: { value: DashboardPeriod; label: string }[] = [
  { value: "day", label: "24 hours" },
  { value: "month", label: "30 days" },
  { value: "year", label: "1 year" },
  { value: "all", label: "All history" },
];

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remaining}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function shortDate(value: Date, period: DashboardPeriod): string {
  return new Intl.DateTimeFormat("en", period === "day"
    ? { hour: "2-digit", minute: "2-digit" }
    : period === "year" || period === "all" ? { month: "short", year: "2-digit" } : { day: "2-digit", month: "short" }
  ).format(new Date(value));
}

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  if (!await isAdminAuthenticated()) redirect("/admin/login");
  const params = await searchParams;
  const period = periods.some((item) => item.value === params.period) ? params.period as DashboardPeriod : "month";

  const demoMode = process.env.ANALYTICS_DEMO_MODE === "true" && process.env.VERCEL_ENV !== "production";
  if (!analyticsEnabled() && !demoMode) return <ConfigurationState message="Analytics collection is disabled. Set NEXT_PUBLIC_ANALYTICS_ENABLED=true after configuring and migrating the database." />;

  let data: Awaited<ReturnType<typeof getDashboardData>>;
  if (demoMode) {
    data = getDemoDashboardData(period);
  } else try {
    data = await getDashboardData(period);
  } catch (error) {
    const message = error instanceof DatabaseConfigurationError
      ? "DATABASE_URL is missing. Add it to .env.local and run npm run db:migrate."
      : "The analytics database could not be reached. Check DATABASE_URL and the migration status.";
    return <ConfigurationState message={message} />;
  }

  const maximum = Math.max(...data.series.map((item) => item.views), 1);
  return (
    <main className="admin-shell">
      <DashboardAutoRefresh />
      <header className="admin-header">
        <div><div className="admin-kicker">AT / PRIVATE OBSERVATORY</div><h1>Traffic &amp; tool activity</h1></div>
        <div className="admin-header-actions">
          <span className="admin-live"><i />{data.summary.live_visitors} live now</span>
          <form action="/api/admin/logout" method="post"><button className="admin-icon-button" aria-label="Sign out"><LogOut size={17} /></button></form>
        </div>
      </header>

      <nav className="admin-periods" aria-label="Analytics period">
        {periods.map((item) => <Link key={item.value} href={`/admin?period=${item.value}`} className={item.value === period ? "active" : ""}>{item.label}</Link>)}
      </nav>

      <section className="admin-metrics" aria-label="Summary metrics">
        <Metric icon={<Activity />} label="Live visitors" value={String(data.summary.live_visitors)} detail="active in 2 minutes" />
        <Metric icon={<Users />} label="Unique visitors" value={data.summary.unique_visitors.toLocaleString()} detail="privacy-safe hashes" />
        <Metric icon={<Eye />} label="Page views" value={data.summary.page_views.toLocaleString()} detail={`${data.summary.sessions.toLocaleString()} sessions`} />
        <Metric icon={<Clock3 />} label="Average session" value={formatDuration(data.summary.avg_duration)} detail="foreground time" />
        <Metric icon={<Clock3 />} label="Total attention" value={formatDuration(data.summary.total_duration)} detail="stored foreground time" />
      </section>

      <section className="admin-panel admin-chart-panel" aria-labelledby="traffic-title">
        <div className="admin-panel-heading"><div><h2 id="traffic-title">Traffic history</h2><p>Page views and unique visitors over the selected period.</p></div><Database size={18} /></div>
        {data.series.length ? <div className="admin-bars">
          {data.series.map((item) => <div className="admin-bar-item" key={new Date(item.bucket).toISOString()} title={`${item.views} views · ${item.visitors} visitors`}>
            <div className="admin-bar-track"><span style={{ height: `${Math.max((item.views / maximum) * 100, 3)}%` }} /></div>
            <span>{shortDate(item.bucket, period)}</span>
          </div>)}
        </div> : <EmptyState text="No traffic has been recorded for this period." />}
      </section>

      <div className="admin-grid">
        <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Popular pages</h2><p>Routes visitors open most.</p></div></div>
          <DataTable headers={["Path", "Views", "Avg. time"]} rows={data.topPages.map((item) => [item.path, String(item.views), formatDuration(item.avg_seconds)])} />
        </section>
        <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Popular sections</h2><p>Long-page areas that entered view.</p></div></div>
          <DataTable headers={["Section", "Views"]} rows={data.topSections.map((item) => [item.section, String(item.views)])} />
        </section>
      </div>

      <section className="admin-panel" aria-labelledby="activity-title">
        <div className="admin-panel-heading"><div><h2 id="activity-title">Encrypted tool records</h2><p>Latest 100 GPT and compiler submissions. Common secret formats are redacted before AES-256-GCM encryption.</p></div></div>
        {data.sensitive.length ? <div className="admin-log-list">
          {data.sensitive.map((item) => <details key={item.id} className="admin-log">
            <summary><span className={`admin-log-kind ${item.kind}`}>{item.kind === "gpt" ? "ThanosGPT" : "Compiler"}</span><time>{new Date(item.occurredAt).toLocaleString()}</time><span>Open record</span></summary>
            <pre>{JSON.stringify(item.payload, null, 2)}</pre>
          </details>)}
        </div> : <EmptyState text="No GPT or compiler records have been stored for this period." />}
      </section>

      <footer className="admin-footer"><span>History: {process.env.ANALYTICS_RETENTION_DAYS || 730} days</span><span>Sensitive records: {process.env.SENSITIVE_LOG_RETENTION_DAYS || 30} days</span><Link href="/">View portfolio ↗</Link></footer>
    </main>
  );
}

function Metric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return <article className="admin-metric"><div className="admin-metric-icon">{icon}</div><div><p>{label}</p><strong>{value}</strong><span>{detail}</span></div></article>;
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  if (!rows.length) return <EmptyState text="No records for this period." />;
  return <div className="admin-table-wrap"><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={`${row[0]}-${index}`}>{row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody></table></div>;
}

function EmptyState({ text }: { text: string }) { return <p className="admin-empty">{text}</p>; }

function ConfigurationState({ message }: { message: string }) {
  return <main className="admin-config"><div className="admin-login-mark">AT / PRIVATE</div><h1>Dashboard setup required</h1><p>{message}</p><code>npm run admin:secrets<br />npm run db:migrate</code><form action="/api/admin/logout" method="post"><button>Sign out</button></form></main>;
}
