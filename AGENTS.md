# Working on the portfolio

These instructions apply throughout this Astro repository. Run commands from the repository root.
When checks change, update this guide alongside [the workflows](.github/workflows/) and
[the npm scripts](package.json).

## Push through a pull request

1. For a new task, fetch `origin` and create a topic branch from `origin/main`. For an existing PR, use its head branch.
2. Run the preflight below. Review `git status --short`, stage only the intended files, and inspect `git diff --cached` before committing.
3. Push the topic branch with `git push -u origin HEAD`. Open a PR targeting `main`. Record what you tested and any checks you could only run on GitHub.
4. Watch the PR's **Checks** tab or run `gh pr checks --watch` with an authenticated CLI. On failure, read the first failing step, fix the cause, and push to the same branch. Verify checks on the latest commit before merging an authorized PR.

Do not push directly to `main`. A push there starts the Pages build immediately. Pages waits only for its own build. It can publish while the separate CI and security checks are still running.

## Before pushing

Use Node 22 from [.nvmrc](.nvmrc), at least 22.12.0. With nvm, run `nvm install && nvm use`.
Run these commands in order, stopping at the first failure. Even a Markdown-only PR runs CI.

```sh
npm ci
npm audit --audit-level=high
npm run test:security
npm run test:unit
npm run format:check
npm run lint
npm run check
rm -f .cache/github.json
CI=true npm run build
npm run test:site
```

The unit tests write an example project to the generated `.cache/github.json`. Remove that fixture before building. Otherwise a local build can pass the site tests with only the example project, and Lighthouse will be missing its real project page.

GitHub currently has the browser workflow disabled. For UI changes, run the browser suite locally against the fresh build and report its result in the PR. On a Linux host, use:

```sh
npx playwright install --with-deps chromium firefox webkit
CI=true npm run test:browser
```

Playwright starts the preview server on port 4321. Leave that port free. The suite covers Chromium, Firefox, WebKit and mobile Chromium. If the workflow is enabled again, download its `playwright-report` artifact to inspect the failing test and trace.

`npm run test:all` omits the audit and format check. A clean build also needs access to GitHub for portfolio data. If rate-limited locally, supply a read-only `GITHUB_TOKEN` through the environment. Keep tokens out of commits, logs and client code.

## What GitHub runs

The table lists the triggers configured in Git. Check current enablement with `gh workflow list --all` when an expected run is missing.

| Workflow                                             | When it runs (UTC)                          | What to check                                                                                                                      |
| ---------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| [CI](.github/workflows/ci.yml)                       | PR to main, push to main, Mon 04:00, manual | Quality steps above, then Lighthouse on the built site. Dependency review runs only on PRs and fails on high or critical findings. |
| [Browser tests](.github/workflows/browser-tests.yml) | PR to main, Sun 02:00, manual               | Currently disabled in GitHub. When enabled, builds the site and runs Playwright and axe accessibility checks.                      |
| [Supply chain](.github/workflows/supply-chain.yml)   | PR to main, push to main, Mon 03:00, manual | actionlint checks workflows, Gitleaks scans full Git history, and zizmor audits Actions security.                                  |
| [CodeQL](.github/workflows/codeql.yml)               | PR to main, push to main, Mon 06:00         | Analyzes JavaScript and TypeScript with security-and-quality queries.                                                              |
| [Pages](.github/workflows/deploy.yml)                | Push to main, daily 05:00, manual           | Builds and publishes `dist/`. Confirm the deploy job succeeded before reporting the change live.                                   |
| [Weekly report](.github/workflows/weekly-report.yml) | Mon 07:00, manual                           | Posts an analytics issue. Runs independently of PRs and deployment.                                                                |

## Common PR failures

- **Formatting** — Run `npx prettier --write <changed-file>` on the file named by CI, then rerun `npm run format:check`. Avoid unrelated formatting changes.
- **Dependencies** — When changing a dependency, update and commit both `package.json` and `package-lock.json`. Use `npm ci` to verify a clean install.
- **Site output** — Edit source under `src/` or static assets under `public/`, then rebuild. Keep generated output, caches and test reports out of Git. The site tests check local links, image alt attributes, page metadata and `rel="noopener"` on links that open a new tab.
- **Lighthouse** — Accessibility and SEO scores below 0.95 fail the check. Performance and best-practices scores below 0.90 warn. See [the audited pages and budgets](lighthouserc.json).
- **Workflow changes** — Follow existing full-commit-SHA action pins, narrow token permissions and `persist-credentials: false` on checkout. Never commit a credential, even temporarily. A later deletion leaves it in the history Gitleaks scans.
- **Failing assertions** — Reproduce the failing check. For an intentional behavior change, update the relevant test with the implementation. Do not skip tests, lower budgets or broaden permissions to get a green PR.

See [tests/TESTING.md](tests/TESTING.md) for test coverage and limitations.
