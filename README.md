# Athanasios Tasis — portfolio platform

A production Next.js portfolio using exactly three hosted platforms:

- **Vercel:** web hosting, server functions, Web Analytics, Speed Insights, Firewall, bot protection, and isolated code execution.
- **Supabase:** Postgres analytics history, encrypted submission logs, authentication, and the private admin dashboard.
- **GitHub:** source control, repository data, Actions, and Dependabot.

ThanosGPT is a deterministic, portfolio-only guide. It does not call a general-purpose model. The Code Lab executes untrusted source inside a fresh, network-disabled Vercel Sandbox created from a prebuilt toolchain snapshot.

## Local setup

Requirements: Node.js 22+, npm, a Supabase project, a Vercel account, and the Vercel CLI.

```bash
npm install
npx vercel link
npx vercel env pull .env.local
npm run dev
```

Never commit `.env.local`. Browser-visible values are limited to the Supabase URL, Supabase publishable key, and analytics feature flag. Supabase secret keys, encryption material, and Vercel configuration remain server-side.

After the first install, commit the refreshed `package-lock.json`; later clean installs can use `npm ci`.

## Required Vercel variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe Supabase publishable key |
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | Set to `true` in production |
| `SUPABASE_SECRET_KEY` | Server-only Supabase secret/service-role key |
| `ANALYTICS_HASH_SALT` | Random value of at least 32 characters |
| `ANALYTICS_ENCRYPTION_KEY` | Base64-encoded 32-byte AES key |
| `ANALYTICS_RETENTION_DAYS` | Analytics history retention, recommended `730` |
| `SENSITIVE_LOG_RETENTION_DAYS` | GPT/compiler log retention, recommended `30` |
| `VERCEL_SANDBOX_SNAPSHOT_ID` | Snapshot produced by `npm run sandbox:provision` |
| `GITHUB_TOKEN` | Optional GitHub token for higher repository API limits |

Generate safe values in PowerShell:

```powershell
$saltBytes = New-Object byte[] 48
[Security.Cryptography.RandomNumberGenerator]::Fill($saltBytes)
[Convert]::ToBase64String($saltBytes)

$keyBytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Fill($keyBytes)
[Convert]::ToBase64String($keyBytes)
```

Use the first output for `ANALYTICS_HASH_SALT` and the second for `ANALYTICS_ENCRYPTION_KEY`.

## Supabase setup

1. Create a Supabase project.
2. Open **SQL Editor** and apply, in order:
   - `supabase/migrations/202606190001_portfolio_platform.sql`
   - `supabase/migrations/202606190002_advisor_hardening.sql`
3. In **Authentication → URL Configuration**, set the production site URL and add Vercel preview URLs if previews need admin login.
4. Create your administrator in **Authentication → Users**.
5. Copy that user UUID and run:

```sql
insert into public.admin_users (user_id) values ('YOUR_AUTH_USER_UUID');
```

6. Confirm Row Level Security is enabled and run Supabase Security Advisor.
7. Deploy `admin-dashboard` and `analytics-ingest` if you want the retained Supabase function utilities. Deploy local `chat` and `execute` as authenticated 410 tombstones so old public endpoints cannot be used.

The live browser uses same-origin Vercel routes for chat, compiler, and analytics. The Supabase secret key must never appear in any `NEXT_PUBLIC_` variable.

## Compiler snapshot

The compiler uses a disposable sandbox with outbound networking disabled. Provision the toolchain once:

```bash
npx vercel env pull .env.local --yes
npm run sandbox:provision
```

Copy the printed `VERCEL_SANDBOX_SNAPSHOT_ID` into Vercel for Production, Preview, and Development. The provisioning sandbox temporarily downloads language toolchains; visitor sandboxes restore from the snapshot with `networkPolicy: "deny-all"`.

## GitHub Actions secrets

In **GitHub → repository → Settings → Secrets and variables → Actions**, add:

| Secret | Where to obtain it |
|---|---|
| `VERCEL_TOKEN` | Vercel account settings → Tokens |
| `VERCEL_ORG_ID` | `.vercel/project.json` after `npx vercel link` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` after `npx vercel link` |

The `quality` workflow runs the service-boundary check, lint, type checking, production build, and Playwright tests. After it succeeds on `main`, `deploy-vercel-production` deploys the exact prebuilt artifact and applies the Vercel Firewall baseline.

## Production deployment

1. Push the repository to GitHub.
2. Import the GitHub repository in Vercel and leave Framework Preset as **Next.js**.
3. Add every required Vercel variable above to **Production**. Add separate Supabase test-project values to Preview if previews must not touch production data.
4. Provision and add the sandbox snapshot ID.
5. Add the three GitHub Actions secrets.
6. Push to `main` and watch **GitHub → Actions → quality**.
7. When quality passes, watch **deploy-vercel-production**. It builds, deploys, inspects, then configures Vercel Firewall.
8. In Vercel, enable Web Analytics and Speed Insights. In **Firewall**, verify Bot Protection, AI-bot blocking, the scanner rule, scraper challenge, and per-IP ceiling are active.
9. Attach the production domain, then update the Supabase Auth site URL to that exact HTTPS origin.
10. Sign in at `/admin`, verify current visitors and historical ranges, run one compiler sample, ask one portfolio question, and confirm both encrypted records appear in the dashboard.

Manual production deployment remains available:

```bash
npx vercel pull --yes --environment=production
npx vercel build --prod
npx vercel deploy --prebuilt --prod
```

## Verification

```bash
npm run check:services
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

The boundary check fails CI if application code or deployment documentation introduces a hosted dependency outside Vercel, Supabase, or GitHub.
