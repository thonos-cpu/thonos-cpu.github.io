import { redirect } from "next/navigation";
import Link from "next/link";

import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isAdminAuthenticated()) redirect("/admin");
  const { error } = await searchParams;
  const message = error === "locked"
    ? "Too many attempts. Wait fifteen minutes and try again."
    : error === "invalid" ? "The credentials did not match." : null;

  return (
    <main className="admin-login-shell">
      <div className="admin-login-mark">AT / PRIVATE</div>
      <section className="admin-login-panel" aria-labelledby="login-title">
        <h1 id="login-title">Analytics access</h1>
        <p>Private traffic history and encrypted interaction records.</p>
        {message ? <div className="admin-alert" role="alert">{message}</div> : null}
        <form action="/api/admin/login" method="post" className="admin-login-form">
          <label>Username<input name="username" type="text" autoComplete="username" required /></label>
          <label>Password<input name="password" type="password" autoComplete="current-password" minLength={14} required /></label>
          <button type="submit">Sign in</button>
        </form>
        <Link className="admin-back" href="/">← Return to portfolio</Link>
      </section>
    </main>
  );
}
