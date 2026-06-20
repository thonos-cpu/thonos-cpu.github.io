# Security model

## Platform boundary

Production traffic and data use only Vercel, Supabase, and GitHub. CI enforces that boundary with `npm run check:services`.

## Controls

- Vercel provides managed DDoS mitigation, Firewall rules, bot challenges, scraper blocking, TLS, and security headers.
- Vercel API routes validate size and type, enforce short execution limits, and use persistent Supabase-backed quotas.
- Each compiler request starts a fresh Vercel Sandbox from a controlled snapshot. It has one vCPU, a short lifetime, bounded output, and no outbound network access.
- ThanosGPT is a deterministic portfolio lookup with topic allowlisting and unrelated-intent rejection.
- Supabase tables use Row Level Security. Public clients receive only the publishable key; privileged database access exists only in server functions.
- Questions and submitted source are redacted for common secret patterns, encrypted with AES-256-GCM, and retained for a configured period.
- The private dashboard requires Supabase Authentication plus membership in `admin_users`.
- Security headers deny framing, plugins, unneeded browser capabilities, and connections outside the three-platform boundary.

## Operator checklist

1. Keep all server secrets in Vercel encrypted environment variables.
2. Use a separate Supabase project for untrusted preview deployments.
3. Enable Vercel Bot Protection and apply `scripts/configure-vercel-firewall.mjs` after project creation.
4. Rotate `SUPABASE_SECRET_KEY`, `ANALYTICS_HASH_SALT`, and `ANALYTICS_ENCRYPTION_KEY` after suspected compromise. Retain an old encryption key offline only when historical records must remain decryptable.
5. Review Vercel Firewall events, function logs, Supabase Security Advisor, admin sign-ins, and encrypted submission metadata regularly.
6. Rebuild the compiler snapshot after toolchain security updates.
7. Keep GitHub branch protection, secret scanning, Dependabot, dependency review, and CodeQL enabled.

## Reporting

Report vulnerabilities privately through GitHub Security Advisories. Do not include production secrets or personal visitor data in an issue.
