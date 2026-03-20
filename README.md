# tasis.info — Personal Portfolio

> Live at **[tasis.info](https://tasis.info)** · Built with vanilla HTML/CSS/JS · Powered by the GitHub API

---

## Overview

A futuristic personal portfolio site that **auto-updates from GitHub** — no rebuilds, no CMS, no manual edits. Every time someone visits, the site fetches live data directly from the GitHub API, so your profile, projects, and stats are always current.

## Features

- **Live GitHub profile** — name, bio, avatar, location, and join date pulled in real time
- **Auto-updating projects** — all public repos appear automatically; new ones show up the moment they're created
- **Stats dashboard** — total repositories, followers, following, stars, and forks aggregated live
- **Language breakdown** — animated bar chart of your most-used languages across all repos
- **Search & sort** — filter repos by name/description, sort by most recent, most starred, or alphabetical
- **Terminal block** — displays your raw GitHub API response as a styled code readout
- **Zero dependencies** — pure HTML, CSS, and JavaScript; no frameworks, no build step

## Stack

| Layer | Tech |
|-------|------|
| Hosting | GitHub Pages |
| Data | GitHub REST API v3 |
| Fonts | Syne + Space Mono (Google Fonts) |
| Styling | Vanilla CSS with custom properties |
| Scripting | Vanilla JavaScript (ES2020+) |

## How It Works

The site calls `https://api.github.com/users/thonos-cpu` and `https://api.github.com/users/thonos-cpu/repos` on every page load. No token required — public data only. GitHub's API allows up to 60 unauthenticated requests per hour per IP, which is plenty for a portfolio.

```
Browser → GitHub API → renders live data
```

To update your portfolio, just update your GitHub profile or push a new repo. Done.

## Local Development

No build tools needed — just open the file:

```bash
git clone https://github.com/thonos-cpu/thonos-cpu.github.io
cd thonos-cpu.github.io
open index.html   # or just drag it into a browser
```

## Deployment

The site deploys automatically via GitHub Pages on every push to `main`.

Custom domain is configured via the `CNAME` file:
```
tasis.info
```

DNS is set up through IONOS with 4 A records pointing to GitHub's servers and a CNAME for `www`.

## DNS Records

| Type | Host | Value |
|------|------|-------|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | thonos-cpu.github.io |

---

Made by [@thonos-cpu](https://github.com/thonos-cpu)
