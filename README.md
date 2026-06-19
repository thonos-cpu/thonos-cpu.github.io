# tasis.info — Engineering Observatory

Athanasios Tasis's personal portfolio: a fast, accessible Next.js application with an in-site GitHub repository explorer, a 15-language code lab, and a tightly scoped portfolio assistant.

## Stack

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4
- Server Components by default; client JavaScript limited to interactive tools
- First-party Postgres analytics plus Vercel Speed Insights
- Vercel AI SDK 6 with a factual local fallback
- Cloudflare Turnstile-ready API protection
- Playwright desktop and mobile end-to-end tests

## Local development

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open `http://127.0.0.1:3000`.

## Environment

| Variable | Purpose |
|---|---|
| `GITHUB_TOKEN` | Optional server-only token for higher GitHub API limits |
| `VERCEL_OIDC_TOKEN` / `AI_GATEWAY_API_KEY` | Enables the hosted ThanosGPT model |
| `THANOSGPT_MODEL` | AI Gateway model, defaults to `openai/gpt-5.4` |
| `PISTON_API_URL` | Code execution service; self-host Piston for production |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public Turnstile widget key |
| `TURNSTILE_SECRET_KEY` | Server-only Turnstile verification key |
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | Enables the first-party tracker after database setup |
| `DATABASE_URL` | Server-only Postgres/Neon connection string |
| `ANALYTICS_HASH_SALT` | HMAC salt used before visitor identity storage |
| `ANALYTICS_ENCRYPTION_KEY` | 32-byte base64 AES key for GPT/compiler records |
| `ADMIN_USERNAME` | Private dashboard username |
| `ADMIN_PASSWORD_HASH` | Scrypt password hash; plaintext is never stored |
| `ADMIN_SESSION_SECRET` | Signs 12-hour HTTP-only admin sessions |

Never prefix GitHub, AI Gateway, or Turnstile secrets with `NEXT_PUBLIC_`.

## Private analytics setup

1. Provision Postgres or Neon and place its connection string in `.env.local` as `DATABASE_URL`.
2. Generate the administrator hash and encryption secrets:

   ```powershell
   $env:ADMIN_PASSWORD="choose-a-long-unique-password"
   npm run admin:secrets
   ```

3. Copy the four generated values into `.env.local`, add `ADMIN_USERNAME`, and run:

   ```bash
   npm run db:migrate
   ```

4. Set `NEXT_PUBLIC_ANALYTICS_ENABLED=true`, restart the app, and open `/admin/login`.

The dashboard includes live visitors, daily/monthly/yearly history, unique visitors, page views, foreground time, popular routes and long-page sections, plus encrypted GPT/compiler records. Anonymous history defaults to 730 days; sensitive submissions default to 30 days.

The public privacy page includes an anonymous-analytics opt-out. Deliberately submitted GPT questions and compiler source are disclosed beside those controls, redacted for common credential formats, and encrypted at rest.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
npm run test:e2e
npm audit --omit=dev
```

## Deployment

This version needs server routes, so it cannot run as a plain GitHub Pages site. Import this GitHub repository into Vercel, add the environment variables, and attach `tasis.info`. Put the domain behind Cloudflare in proxied mode and follow [SECURITY.md](./SECURITY.md).

The homepage is statically generated and revalidates GitHub data hourly. The compiler and chat endpoints run only on demand.
