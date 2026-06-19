# Security and abuse resistance

No public site can promise immunity from DDoS attacks or determined scraping. This project uses independent controls at the Vercel edge, Supabase API layer, database, browser, and execution sandbox.

## Implemented controls

- Vercel automatic Layer 3/4 and Layer 7 DDoS mitigation.
- A deployment-time Vercel Firewall baseline: Bot Protection challenges, known AI crawler denial, exploit-scanner blocking, obvious scraper challenges, and a global per-IP ceiling.
- CSP, HSTS, frame denial, MIME-sniffing prevention, strict referrer policy, cross-origin isolation controls, and restrictive browser permissions.
- Supabase RLS on every private table. Browser clients receive only the publishable key; the service role remains inside Edge Functions.
- Supabase Auth and an `admin_users` allowlist protect analytics and decrypted interaction records.
- Persistent PostgreSQL rate limits protect Supabase Edge Functions across instances and regions.
- Turnstile is verified server-side before GPT or compiler execution.
- Raw IP addresses are never stored. IP plus user-agent is transformed using a keyed HMAC.
- GPT questions and compiler source are redacted for common secret formats and encrypted using AES-256-GCM before storage.
- ThanosGPT validates length, blocks unrelated and injection-oriented requests before model invocation, and is grounded in a fixed public record.
- Compiler requests use a language allowlist, 20 KB source limit, bounded output, execution timeouts, and an external Piston sandbox.
- GitHub README content is rendered as plain text, never untrusted HTML.
- CodeQL, dependency review, Dependabot, npm audit, linting, type checking, production builds, and Playwright run before production deployment.

## Platform configuration still required

1. Create a Cloudflare Turnstile Managed widget restricted to `tasis.info`, `www.tasis.info`, and the chosen Vercel preview hostname.
2. Enable Vercel Attack Challenge Mode manually only during an active attack. It intentionally challenges all visitors and is not a normal always-on setting.
3. Review Vercel Firewall events after launch. Start with the generated rules, then tune false positives using observed traffic.
4. Enable Vercel deployment protection for preview environments if previews may contain sensitive test data.
5. Enable leaked-password protection, MFA for the administrator, and email-confirmation controls in Supabase Auth.
6. Self-host Piston in an isolated environment before promoting the compiler for sustained public use. Disable container networking and enforce CPU, memory, process, and wall-clock limits.
7. Rotate `OPENAI_API_KEY`, `TURNSTILE_SECRET_KEY`, `ANALYTICS_HASH_SALT`, and `ANALYTICS_ENCRYPTION_KEY` after suspected compromise. Retain the previous encryption key offline if historical records must remain decryptable.

## Data boundaries

- **Browser-visible:** Supabase URL, Supabase publishable key, Turnstile site key, analytics enable flag.
- **Vercel encrypted settings:** optional build-time `GITHUB_TOKEN` and public build configuration.
- **Supabase Edge Function secrets:** OpenAI, Turnstile secret, Piston endpoint, HMAC salt, encryption key, retention, and allowed origins.
- **GitHub Actions secrets:** Vercel token, organization ID, and project ID.

The public portfolio remains indexable for recruiters and search engines. Expensive interactions receive the strongest controls; public text can still be copied by a determined human and should be treated as public information.

Report vulnerabilities privately to `athanasios@tasis.info`. Do not include live secrets or perform destructive load testing.
