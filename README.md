<div align="center">

# Athanasios Tasis

### Data Engineering • Machine Learning • Time-Series Analytics

_Computer Engineering &amp; Informatics — University of Patras_

[![Live site](https://img.shields.io/badge/live-tasis.info-79c6e4?style=for-the-badge)](https://tasis.info)
&nbsp;
[![Deploy](https://github.com/thonos-cpu/thonos-cpu.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/thonos-cpu/thonos-cpu.github.io/actions/workflows/deploy.yml)
&nbsp;
[![CodeQL](https://github.com/thonos-cpu/thonos-cpu.github.io/actions/workflows/codeql.yml/badge.svg)](https://github.com/thonos-cpu/thonos-cpu.github.io/actions/workflows/codeql.yml)

[**Website**](https://tasis.info) · [**GitHub**](https://github.com/thonos-cpu) · [**LinkedIn**](https://www.linkedin.com/in/thanostasis)

</div>

---

I build **scalable data and AI systems** — from IoT data collection and machine-learning
pipelines to HPC environments at **CERN's ALICE experiment**, where I worked with millions of
detector measurements and automated large-scale data-processing workflows. I like turning
complex, data-intensive problems into reliable, efficient solutions with Python, C/C++ and
distributed systems.

> This repository is the source of my portfolio at **[tasis.info](https://tasis.info)**.

## Selected work

| Project                                                                                                | What it is                                                                         | Stack                                |
| ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | ------------------------------------ |
| [Temperature & Humidity Forecasting](https://github.com/thonos-cpu/Temp_Hum_Prediction_Model)          | Time-series forecasting on wireless-sensor-network data (SARIMAX + ML, rolling CV) | Python · pandas · scikit-learn       |
| [TF-IDF Search Engine](https://github.com/thonos-cpu/TFIDF-Search-Engine)                              | Vector-space IR engine + clustering over a medical corpus, with full evaluation    | Python · scikit-learn · Transformers |
| [Distributed Systems](https://github.com/thonos-cpu/Distributed_Systems)                               | Chord & Pastry distributed hash-table engine, validated under node churn           | Python · concurrency                 |
| [Hotel Booking Analytics](https://github.com/thonos-cpu/Hotel-Booking-Data-Analysis-and-Visualization) | EDA on 119K bookings — cancellation drivers & seasonal revenue                     | Python · pandas                      |
| [Thesis Management Platform](https://github.com/thonos-cpu/Thesis_Managment_Website)                   | Role-based academic platform with a public JSON/XML REST API                       | PHP · MySQL                          |

> Every project has a full, rendered write-up on the site — e.g. [tasis.info/projects/distributed-systems](https://tasis.info/projects/distributed-systems).

## About this site

A small engineering exercise in its own right. Instead of calling the GitHub API from the
browser (which rate-limits every visitor), it fetches all profile, repo and README data **at
build time** in CI, renders it to static HTML, and ships plain files to GitHub Pages — so the
site is instant, always fresh, and can't be rate-limited.

- **Stack** — Astro + TypeScript, self-hosted fonts, a hand-written `<canvas>` constellation of
  my repositories (no graph library).
- **READMEs** are compiled through GitHub's own renderer and shown styled, never as raw `.md`.
- **Automation** — GitHub Actions for deploy (daily refresh), lint/type-check/Lighthouse,
  CodeQL security scanning, Dependabot, and a weekly analytics report.
- **Privacy** — cookieless analytics; no tracking beyond aggregate counts.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output → dist/
```

<div align="center">
<sub>Built by hand with Astro · deployed on GitHub Pages · <a href="https://tasis.info">tasis.info</a></sub>
</div>
