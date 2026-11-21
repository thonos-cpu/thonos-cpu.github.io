# Automated quality and security checks

The checks run on pull requests, pushes to main, and scheduled refreshes. This document describes the actual implemented checks, not a claim that all attacks are eliminated.

## Local commands

- `npm ci`
- `npm run test:security`
- `npm run test:unit`
- `npm run lint`
- `npm run format:check`
- `npm run check`
- `npm run build`
- `npm run test:site`
- `npx playwright install chromium firefox webkit`
- `npm run test:browser`
- `npm run test:all`

Browser tests use the built `dist/` output and start the local preview server. They cover Chromium, Firefox, WebKit and mobile Chromium.

## CI checks

| Check                       | Purpose                                                                        |
| --------------------------- | ------------------------------------------------------------------------------ |
| Node regression suite       | Lockfile integrity, workflow invariants, secrets, links and safe HTML          |
| Data unit tests             | Curated metadata, knowledge ranking, fact identity and profile invariants      |
| npm audit                   | Known high/critical dependency vulnerabilities                                 |
| CodeQL                      | JavaScript and TypeScript static analysis                                      |
| Dependency review           | Newly introduced vulnerable packages in pull requests                          |
| Gitleaks                    | Accidental secrets in Git history                                              |
| Actionlint                  | Workflow expression and shell syntax                                           |
| Zizmor                      | GitHub Actions security smells                                                 |
| Prettier and ESLint         | Formatting and code correctness                                                |
| Astro check                 | Type checking                                                                  |
| Build and output assertions | Valid production generation, assets and links                                  |
| Playwright                  | Navigation, JavaScript playground, theme, assistant, mobile and error recovery |
| axe-core                    | Automated WCAG 2.x A/AA checks                                                 |
| Lighthouse                  | Accessibility, performance, SEO and best-practice budgets                      |

## Caveats

A green build does not establish absence of vulnerabilities. In particular, an arbitrary-code playground shares the site's origin in a Web Worker, and a caller-provided `trusted` boolean is not an authorization boundary. Separate-origin sandboxing would be a meaningful architectural hardening step.

Automated accessibility cannot replace manual keyboard and screen-reader reviews. Performance and visual results vary by browser and environment; screenshot comparisons require deliberately reviewed baselines. TLS settings, production CDN headers, service providers, and external destinations must also be audited at the hosting layer.

The build intentionally fetches current public GitHub data. Dependency installation is reproducible through the committed lockfile; identical HTML output across different days is not expected unless the GitHub input data and clock are frozen. Run the same tests on every change and follow up on security scan findings.
