"use client";

import { Activity, Clock3, Database, Eye, LogOut, RefreshCw, Users } from "lucide-react";
import Link from "next/link";
import { FormEvent, ReactNode, useCallback, useEffect, useState } from "react";

import { getSupabaseBrowserClient, supabaseConfigured } from "@/lib/supabase-browser";

type Period = "day" | "month" | "year" | "all";
type DashboardData = {
  summary: { liveVisitors: number; uniqueVisitors: number; sessions: number; pageViews: number; avgDuration: number; totalDuration: number };
  series: { bucket: string; views: number; visitors: number }[];
  topPages: { path: string; views: number; avgSeconds: number }[];
  topSections: { section: string; views: number }[];
  sensitive: { id: number; kind: "gpt" | "compiler"; payload: Record<string, unknown>; metadata: Record<string, unknown>; occurredAt: string }[];
  retention: { analyticsDays: number; sensitiveDays: number };
};

const periods: { value: Period; label: string }[] = [
  { value: "day", label: "24 hours" },
  { value: "month", label: "30 days" },
  { value: "year", label: "1 year" },
  { value: "all", label: "All history" },
];

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function shortDate(value: string, period: Period): string {
  return new Intl.DateTimeFormat("en", period === "day"
    ? { hour: "2-digit", minute: "2-digit" }
    : period === "year" || period === "all" ? { month: "short", year: "2-digit" } : { day: "2-digit", month: "short" }
  ).format(new Date(value));
}

export function AdminPortal() {
  const client = getSupabaseBrowserClient();
  const [checking, setChecking] = useState(() => Boolean(client));
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [period, setPeriod] = useState<Period>("month");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");

  const loadDashboard = useCallback(async (selected: Period) => {
    if (!client) return;
    setLoading(true);
    setDashboardError("");
    const { data: result, error } = await client.functions.invoke("admin-dashboard", { body: { period: selected } });
    if (error) {
      let message = error.message;
      const context = "context" in error ? error.context : null;
      if (context instanceof Response) {
        const details = await context.clone().json().catch(() => null) as { error?: string } | null;
        if (details?.error) message = details.error;
      }
      setDashboardError(message || "Dashboard data is unavailable.");
    } else {
      setData(result as DashboardData);
    }
    setLoading(false);
  }, [client]);

  useEffect(() => {
    if (!client) return;
    void client.auth.getSession().then(({ data: sessionData }) => {
      const signedIn = Boolean(sessionData.session);
      setAuthenticated(signedIn);
      setChecking(false);
    });
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(Boolean(session));
      if (!session) setData(null);
    });
    return () => listener.subscription.unsubscribe();
  }, [client]);

  useEffect(() => {
    if (!authenticated) return;
    const initialLoad = window.setTimeout(() => void loadDashboard(period), 0);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadDashboard(period);
    }, 30_000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(timer);
    };
  }, [authenticated, loadDashboard, period]);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    if (!client) return;
    setLoginError("");
    setChecking(true);
    const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setLoginError("The email or password did not match.");
    setChecking(false);
  }

  async function signOut() {
    await client?.auth.signOut();
    setAuthenticated(false);
    setData(null);
  }

  function changePeriod(next: Period) {
    setPeriod(next);
  }

  if (!supabaseConfigured()) return <ConfigurationState message="Add the public Supabase URL and publishable key to the build environment." />;
  if (checking) return <ConfigurationState message="Checking the encrypted admin session…" loading />;
  if (!authenticated) return (
    <main className="admin-login-shell" id="main">
      <div className="admin-login-mark">AT / PRIVATE</div>
      <section className="admin-login-panel" aria-labelledby="login-title">
        <h1 id="login-title">Analytics access</h1>
        <p>Private traffic history and encrypted interaction records, protected by Supabase Auth.</p>
        {loginError ? <div className="admin-alert" role="alert">{loginError}</div> : null}
        <form className="admin-login-form" onSubmit={signIn}>
          <label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="username" required /></label>
          <label>Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" minLength={12} required /></label>
          <button type="submit">Sign in</button>
        </form>
        <Link className="admin-back" href="/">← Return to portfolio</Link>
      </section>
    </main>
  );
  if (!data) return <ConfigurationState message={dashboardError || "Loading private analytics…"} onSignOut={signOut} loading={loading} />;

  const maximum = Math.max(...data.series.map((item) => item.views), 1);
  return (
    <main className="admin-shell" id="main">
      <header className="admin-header">
        <div><div className="admin-kicker">AT / PRIVATE OBSERVATORY</div><h1>Traffic &amp; tool activity</h1></div>
        <div className="admin-header-actions">
          <span className="admin-live"><i />{data.summary.liveVisitors} live now</span>
          <button className="admin-icon-button" onClick={() => void loadDashboard(period)} aria-label="Refresh dashboard"><RefreshCw size={17} /></button>
          <button className="admin-icon-button" onClick={() => void signOut()} aria-label="Sign out"><LogOut size={17} /></button>
        </div>
      </header>

      {dashboardError ? <div className="admin-alert" role="alert">{dashboardError}</div> : null}
      <nav className="admin-periods" aria-label="Analytics period">
        {periods.map((item) => <button key={item.value} type="button" onClick={() => changePeriod(item.value)} className={item.value === period ? "active" : ""}>{item.label}</button>)}
      </nav>

      <section className="admin-metrics" aria-label="Summary metrics" aria-busy={loading}>
        <Metric icon={<Activity />} label="Live visitors" value={String(data.summary.liveVisitors)} detail="active in 2 minutes" />
        <Metric icon={<Users />} label="Unique visitors" value={data.summary.uniqueVisitors.toLocaleString()} detail="privacy-safe hashes" />
        <Metric icon={<Eye />} label="Page views" value={data.summary.pageViews.toLocaleString()} detail={`${data.summary.sessions.toLocaleString()} sessions`} />
        <Metric icon={<Clock3 />} label="Average session" value={formatDuration(data.summary.avgDuration)} detail="foreground time" />
        <Metric icon={<Clock3 />} label="Total attention" value={formatDuration(data.summary.totalDuration)} detail="stored foreground time" />
      </section>

      <section className="admin-panel admin-chart-panel" aria-labelledby="traffic-title">
        <div className="admin-panel-heading"><div><h2 id="traffic-title">Traffic history</h2><p>Page views and unique visitors over the selected period.</p></div><Database size={18} /></div>
        {data.series.length ? <div className="admin-bars">
          {data.series.map((item) => <div className="admin-bar-item" key={item.bucket} title={`${item.views} views · ${item.visitors} visitors`}>
            <div className="admin-bar-track"><span style={{ height: `${Math.max((item.views / maximum) * 100, 3)}%` }} /></div>
            <span>{shortDate(item.bucket, period)}</span>
          </div>)}
        </div> : <EmptyState text="No traffic has been recorded for this period." />}
      </section>

      <div className="admin-grid">
        <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Popular pages</h2><p>Routes visitors open most.</p></div></div>
          <DataTable headers={["Path", "Views", "Avg. time"]} rows={data.topPages.map((item) => [item.path, String(item.views), formatDuration(item.avgSeconds)])} />
        </section>
        <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Popular sections</h2><p>Long-page areas that entered view.</p></div></div>
          <DataTable headers={["Section", "Views"]} rows={data.topSections.map((item) => [item.section, String(item.views)])} />
        </section>
      </div>

      <section className="admin-panel" aria-labelledby="tool-records-title">
        <div className="admin-panel-heading"><div><h2 id="tool-records-title">Encrypted tool records</h2><p>Latest GPT and compiler submissions. Common secret formats are redacted before AES-256-GCM encryption.</p></div></div>
        {data.sensitive.length ? <div className="admin-log-list">{data.sensitive.map((item) => (
          <details className="admin-log" key={`${item.kind}-${item.id}`}>
            <summary><span className={`admin-log-kind ${item.kind}`}>{item.kind === "gpt" ? "ThanosGPT" : "Compiler"}</span><time>{new Date(item.occurredAt).toLocaleString()}</time><span>Inspect record</span></summary>
            <pre>{JSON.stringify({ ...item.payload, metadata: item.metadata }, null, 2)}</pre>
          </details>
        ))}</div> : <EmptyState text="No GPT or compiler submissions have been retained for this period." />}
      </section>

      <footer className="admin-footer"><span>History: {data.retention.analyticsDays} days</span><span>Sensitive records: {data.retention.sensitiveDays} days</span><Link href="/">View portfolio ↗</Link></footer>
    </main>
  );
}

function Metric({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) {
  return <article className="admin-metric"><span className="admin-metric-icon">{icon}</span><div><p>{label}</p><strong>{value}</strong><span>{detail}</span></div></article>;
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  if (!rows.length) return <EmptyState text="Nothing recorded in this period." />;
  return <div className="admin-table-wrap"><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={`${row[0]}-${rowIndex}`}>{row.map((cell, index) => <td key={`${cell}-${index}`}>{cell}</td>)}</tr>)}</tbody></table></div>;
}

function EmptyState({ text }: { text: string }) { return <p className="admin-empty">{text}</p>; }

function ConfigurationState({ message, onSignOut, loading = false }: { message: string; onSignOut?: () => void; loading?: boolean }) {
  return <main className="admin-config" id="main"><div className="admin-login-mark">AT / PRIVATE</div><h1>{loading ? "One moment" : "Dashboard setup required"}</h1><p>{message}</p>{onSignOut ? <button onClick={onSignOut}>Sign out</button> : null}<Link className="admin-back" href="/">← Return to portfolio</Link></main>;
}
