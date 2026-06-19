# tasis.info — Engineering Observatory

Production portfolio for Athanasios Tasis. Vercel serves the Next.js frontend; Supabase provides PostgreSQL history, Auth, Row Level Security, persistent rate limits, and Edge Functions for analytics, ThanosGPT, code execution, and the private dashboard.

## Architecture

- **Vercel:** Next.js 16, global CDN, optimized images, security headers, automatic DDoS protection, Firewall baseline, preview deployments, and Speed Insights.
- **Supabase:** PostgreSQL 17, Auth, RLS, AES-256-GCM encrypted tool records, analytics aggregation, and four Edge Functions.
- **Cloudflare Turnstile:** human verification before GPT and compiler requests.
- **Piston:** isolated execution for the 15-language code lab. Self-host it before high-volume production use.
- **GitHub Actions:** quality gates, CodeQL, dependency review, and gated Vercel production deployment.

No service-role key, OpenAI key, Turnstile secret, encryption key, database credential, Vercel token, or administrator password is shipped to the browser or committed to Git.

## Local development

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open `http://127.0.0.1:3000`.

## Vercel variables

Set these for Production and Preview in Vercel Project Settings:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key; safe for browser use because RLS is enabled |
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | `true` after Supabase secrets are configured |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile public site key |
| `GITHUB_TOKEN` | Optional server-only token used during page generation for higher GitHub API limits |

## Supabase Edge Function secrets

Set these under Supabase → Project Settings → Edge Functions → Secrets:

| Secret | Purpose |
|---|---|
| `OPENAI_API_KEY` | Enables the hosted GPT response; a factual local fallback remains available |
| `THANOSGPT_MODEL` | `gpt-5.4` unless intentionally changed |
| `TURNSTILE_SECRET_KEY` | Server-side Turnstile verification |
| `PISTON_API_URL` | Prefer a private Piston deployment; public development fallback is `https://emkc.org/api/v2/piston` |
| `ANALYTICS_HASH_SALT` | At least 32 random characters for one-way visitor HMACs |
| `ANALYTICS_ENCRYPTION_KEY` | Base64-encoded 32-byte AES key |
| `ANALYTICS_RETENTION_DAYS` | Recommended `730` |
| `SENSITIVE_LOG_RETENTION_DAYS` | Recommended `30` |
| `ALLOWED_ORIGINS` | `https://tasis.info,https://www.tasis.info,http://localhost:3000,http://127.0.0.1:3000` |
| `ALLOWED_ORIGIN_SUFFIXES` | `.vercel.app` for preview deployments |

Generate the two random analytics secrets locally:

```powershell
node -e "const c=require('node:crypto'); console.log('ANALYTICS_HASH_SALT='+c.randomBytes(32).toString('base64url')); console.log('ANALYTICS_ENCRYPTION_KEY='+c.randomBytes(32).toString('base64'))"
```

## Administrator account

1. In Supabase Auth → Users, create a confirmed email/password user with a unique password.
2. In the Supabase SQL editor, authorize only that user:

   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where email = 'YOUR_ADMIN_EMAIL'
   on conflict (user_id) do nothing;
   ```

3. Set Auth → URL Configuration → Site URL to `https://tasis.info` and add the required Vercel preview redirect URLs.
4. Sign in at `/admin`. The browser stores the Supabase session; RLS and the authenticated Edge Function enforce access.

## Vercel and GitHub deployment

1. Import this repository into Vercel and select Next.js with Node.js 22.
2. Add the Vercel variables above and attach `tasis.info` plus `www.tasis.info`.
3. Add these GitHub Actions secrets:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
4. Push to `main`. The `quality` workflow must pass before `deploy-vercel-production` builds and deploys the exact verified commit.
5. The deployment workflow enables Vercel Firewall, Bot Protection, AI-bot denial, scanner blocking, scraper challenges, and a per-IP request ceiling.

Vercel native Git integration may still be enabled for PR preview deployments. Production is gated through GitHub Actions.

## Verification

```powershell
npm run lint
npm run typecheck
npm run build
npm run test:e2e
npm audit --omit=dev
```

The Playwright suite verifies desktop and mobile layouts, repository interaction, GPT guardrails, compiler behavior, privacy opt-out, admin login protection, console health, horizontal overflow, and the three-second performance budget.
