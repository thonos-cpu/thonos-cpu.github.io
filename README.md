# tasis.info

> Personal portfolio for **Athanasios Tasis** — live at **[tasis.info](https://tasis.info)**.
> A static [Astro](https://astro.build) site that bakes live GitHub data at build time, deployed to GitHub Pages.

The signature element is an interactive **constellation** of every repository — nodes
sized by significance, linked by shared language, orbiting a central hub — rendered
on `<canvas>` with a hand-written force simulation. Data & ML work is weighted to the
front throughout.

---

## Why it's built this way

Most GitHub portfolios call the API **from the browser**, which dies at 60 requests/hour
per visitor and breaks when the API is slow. This site instead fetches everything **at
build time** inside a GitHub Action (authenticated, ~5000 req/h), renders it to static
HTML, and ships plain files. Visitors get an instant, always-fresh site that can never be
rate-limited. A scheduled Action rebuilds daily so it stays current with zero effort.

```
GitHub API ──(build time, in CI)──▶ static HTML/CSS/JS ──▶ GitHub Pages ──▶ visitor
```

## Highlights

- **Build-time data layer** (`src/lib/github.ts`) — profile, repos, languages and READMEs.
- **READMEs rendered like GitHub** — each README is compiled through GitHub's own GFM
  endpoint, sanitised, and shown styled (never as raw `.md`) on per-project pages.
- **Interactive constellation** — `<canvas>` force graph, no heavy libraries, honours
  `prefers-reduced-motion`, pauses off-screen.
- **Two themes** — observatory (dark) / paper (light), no flash on load.
- **Optimised images** — portraits served as responsive WebP via `astro:assets`.
- **Privacy by design** — phone number and home location are never shown; the CV PDF is
  never shipped or downloadable; analytics are cookieless.

## Tech

| Layer     | Tech                                                 |
| --------- | ---------------------------------------------------- |
| Framework | Astro 6 (static output) + TypeScript                 |
| Motion    | Lenis smooth scroll · canvas force sim · CSS reveals |
| Fonts     | Instrument Serif · Geist · Geist Mono (self-hosted)  |
| Data      | GitHub REST API (build time)                         |
| Analytics | GoatCounter (cookieless, the one external service)   |
| Hosting   | GitHub Pages via GitHub Actions                      |

## Local development

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # static output → dist/
npm run preview      # serve the build
npm run check        # astro type check
npm run lint         # eslint
npm run format       # prettier --write
```

Optionally create a `.env` (see `.env.example`) with a `GITHUB_TOKEN` to avoid the
unauthenticated API limit while developing. Build data is cached in `.cache/` for an hour.

## Automation (GitHub Actions)

| Workflow            | Trigger                       | Does                                                               |
| ------------------- | ----------------------------- | ------------------------------------------------------------------ |
| `deploy.yml`        | push to `main`, daily, manual | Build with live data → deploy to Pages                             |
| `ci.yml`            | push / PR                     | Prettier, ESLint, type check, build, Lighthouse, dependency review |
| `codeql.yml`        | push / PR, weekly             | CodeQL security analysis (JS/TS)                                   |
| `weekly-report.yml` | weekly, manual                | Posts a GitHub Issue with visitor analytics                        |
| `dependabot.yml`    | weekly                        | npm + Actions dependency updates                                   |

## One-time setup

1. **Pages source** → repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. **Analytics** → create a free site at [goatcounter.com](https://www.goatcounter.com)
   with code `thonos` (or change `GOATCOUNTER_CODE` in `src/layouts/Base.astro`).
3. **Weekly report** (optional) → in repo settings add:
   - **Variable** `GOATCOUNTER_CODE` = your GoatCounter code
   - **Secret** `GOATCOUNTER_API_TOKEN` = a token from GoatCounter → Settings → API
4. **Custom domain** → handled by `public/CNAME` (`tasis.info`). DNS below.

## DNS

| Type  | Host | Value                |
| ----- | ---- | -------------------- |
| A     | @    | 185.199.108.153      |
| A     | @    | 185.199.109.153      |
| A     | @    | 185.199.110.153      |
| A     | @    | 185.199.111.153      |
| CNAME | www  | thonos-cpu.github.io |

## Editing content

- **CV / bio / skills** → `src/data/profile.ts`
- **Project curation** (taglines, metrics, galleries, weighting) → `src/data/featured.ts`
- New public repos appear automatically on the next build.

---

Made by [@thonos-cpu](https://github.com/thonos-cpu).
