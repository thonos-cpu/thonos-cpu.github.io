# Security and abuse-resistance

No public website can honestly claim to be immune to DDoS or scraping. This project uses layered controls that keep the origin small, cacheable, and difficult to abuse.

## Controls in the codebase

- All GitHub and AI credentials remain server-only.
- The public homepage is statically generated and cached; visitors do not fan out into GitHub API requests.
- Strict input schemas, source-size limits, language allowlists, response-size caps, request timeouts, and per-IP rate limits protect dynamic routes.
- Code is sent to a Piston sandbox; it is never executed inside the Next.js process.
- ThanosGPT accepts one short question, rejects prompt injection and unrelated requests before model invocation, and uses a fixed factual record.
- Turnstile is verified server-side when production keys are configured. Tokens are never accepted on client trust alone.
- Security headers disable framing, MIME sniffing, sensitive browser capabilities, and permissive referrer leakage.
- README content is rendered as escaped plain text, not untrusted HTML.
- Structured logs contain route status and duration, not source code, chat questions, secrets, or personal data.
- Raw IP addresses are never stored. A keyed HMAC transforms IP plus user-agent into a non-reversible visitor identifier.
- GPT questions and compiler submissions are redacted for common credential formats, then encrypted with AES-256-GCM before storage.
- The private dashboard uses scrypt password verification, signed HTTP-only cookies, strict same-site policy, a 12-hour expiry, and login throttling.

The in-memory rate limiter is a fast first layer, not a distributed global quota. Cloudflare must enforce the authoritative edge limits below.

## Sensitive analytics keys

Keep `DATABASE_URL`, `ANALYTICS_HASH_SALT`, `ANALYTICS_ENCRYPTION_KEY`, `ADMIN_PASSWORD_HASH`, and `ADMIN_SESSION_SECRET` only in `.env.local` and the deployment platform's encrypted environment settings. Rotate the session secret after suspected compromise. Rotating the analytics encryption key makes earlier sensitive records unreadable unless the prior key is retained offline.

## Cloudflare production checklist

1. Proxy `tasis.info` through Cloudflare and keep the Vercel origin hostname out of public links.
2. Enable Cloudflare's managed WAF rules and automatic DDoS protection.
3. Create Turnstile Managed widgets for `/api/chat` and `/api/execute`; set both environment key pairs in Vercel.
4. Create edge rate rules:
   - `/api/chat`: challenge above 8 requests per minute per IP; block above 20.
   - `/api/execute`: challenge above 5 requests per minute per IP; block above 10.
   - `/api/repositories/*`: cache and cap at 60 requests per minute per IP.
5. Enable Bot Fight Mode (or Bot Management on eligible plans), Browser Integrity Check, and block known automated scraping user agents where they are not legitimate search crawlers.
6. Cache static assets aggressively, respect Vercel's immutable asset headers, and do not cache dynamic POST responses.
7. Alert on spikes in 403, 429, 5xx, chat duration, and compiler duration.
8. Self-host Piston on an isolated, resource-constrained service before advertising the compiler broadly. Disable networking inside execution containers and enforce CPU, memory, process, and wall-clock limits at the container runtime.

## Scraping reality

Public portfolio text can always be copied by a determined human or browser automation. The goal is to stop bulk automated extraction without making recruiters solve puzzles on every page. Turnstile and strict edge limits are therefore applied to expensive interactions, while the public portfolio remains indexable and accessible.

## Reporting

Report a vulnerability privately to `athanasios@tasis.info`. Do not include live secrets, exploit other users, or run destructive load tests.
