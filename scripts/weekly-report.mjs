/**
 * Weekly analytics report.
 *
 * Runs in GitHub Actions on a schedule. Pulls the last 7 days of stats from
 * GoatCounter (visitors, top sections, top countries) plus GitHub repo traffic,
 * then opens a GitHub Issue with a readable summary. Everything is best-effort:
 * if a source is unconfigured or errors, that section is simply marked
 * "unavailable" and the report still posts.
 *
 * Env:
 *   GOATCOUNTER_CODE        e.g. "thanos"  (https://thanos.goatcounter.com)
 *   GOATCOUNTER_API_TOKEN   API token from GoatCounter → Settings → API
 *   GITHUB_TOKEN            provided automatically by Actions
 *   GITHUB_REPOSITORY       "owner/repo", provided automatically by Actions
 */

const GC_CODE = process.env.GOATCOUNTER_CODE || "thanos";
const GC_TOKEN = process.env.GOATCOUNTER_API_TOKEN || "";
const GH_TOKEN = process.env.GITHUB_TOKEN || "";
const GH_TRAFFIC_TOKEN = process.env.GH_TRAFFIC_TOKEN || "";
const REPO = process.env.GITHUB_REPOSITORY || "";

const now = new Date();
const weekAgo = new Date(now.getTime() - 7 * 864e5);
const d = (x) => x.toISOString().slice(0, 10);
const START = d(weekAgo);
const END = d(now);

const num = (n) => new Intl.NumberFormat("en-GB").format(n ?? 0);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const detail = (error) => {
  const parts = [
    error?.message,
    error?.cause?.code,
    error?.cause?.message,
  ].filter(Boolean);
  return [...new Set(parts)].join(": ");
};

const warning = (title, error) => {
  const message = detail(error)
    .replace(/%/g, "%25")
    .replace(/\r/g, "%0D")
    .replace(/\n/g, "%0A");
  console.warn(`::warning title=${title}::${message}`);
};

async function requestJson(url, options, label) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    let res;
    try {
      res = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(15_000),
      });
    } catch (error) {
      lastError = new Error(`${label} → ${detail(error)}`);
    }

    if (res?.ok) return res.json();

    if (res) {
      const body = (await res.text()).trim().replace(/\s+/g, " ").slice(0, 200);
      lastError = new Error(
        `${label} → ${res.status}${body ? `: ${body}` : ""}`,
      );
      if (res.status !== 429 && res.status < 500) throw lastError;
    }

    if (attempt < 3) await sleep(500 * 2 ** (attempt - 1));
  }
  throw lastError;
}

async function gc(path) {
  return requestJson(
    `https://${GC_CODE}.goatcounter.com/api/v0${path}`,
    {
      headers: {
        Authorization: `Bearer ${GC_TOKEN}`,
        "Content-Type": "application/json",
      },
    },
    `GoatCounter ${path}`,
  );
}

async function gh(path, token = GH_TOKEN) {
  return requestJson(
    `https://api.github.com${path}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
    `GitHub ${path}`,
  );
}

async function goatcounterHits() {
  const hits = [];
  const excluded = [];

  while (true) {
    const params = new URLSearchParams({
      start: START,
      end: END,
      limit: "100",
    });
    for (const pathId of excluded) params.append("exclude_paths", pathId);
    const page = await gc(`/stats/hits?${params}`);
    hits.push(...(page.hits ?? []));
    if (!page.more || !page.hits?.length) return hits;
    excluded.push(...page.hits.map((hit) => String(hit.path_id)));
  }
}

async function goatcounterSection() {
  if (!GC_TOKEN)
    return "> GoatCounter API token not configured — skipping visitor analytics.\n";
  const lines = [];
  let hits = null;

  try {
    hits = await goatcounterHits();
  } catch (error) {
    warning("GoatCounter page breakdown", error);
  }

  try {
    const total = await gc(`/stats/total?start=${START}&end=${END}`);
    lines.push(
      `**${num(total.total)}** pageviews · **${num(total.total_events)}** events\n`,
    );
  } catch (error) {
    warning("GoatCounter totals", error);
    if (hits) {
      const pageviews = hits
        .filter((hit) => !hit.event)
        .reduce((sum, hit) => sum + hit.count, 0);
      const events = hits
        .filter((hit) => hit.event)
        .reduce((sum, hit) => sum + hit.count, 0);
      lines.push(
        `**${num(pageviews)}** pageviews · **${num(events)}** events _(calculated from breakdown)_\n`,
      );
    } else {
      lines.push(`_Totals unavailable (${detail(error)})._\n`);
    }
  }

  if (hits) {
    const pages = hits
      .filter((hit) => !hit.event)
      .sort((a, b) => b.count - a.count);
    const events = hits
      .filter((hit) => hit.event)
      .sort((a, b) => b.count - a.count);

    if (pages.length) {
      lines.push("\n**Top pages**\n");
      lines.push("| Page | Views |\n| --- | ---: |");
      for (const page of pages.slice(0, 8))
        lines.push(`| \`${page.path}\` | ${num(page.count)} |`);
      lines.push("");
    }
    if (events.length) {
      lines.push("\n**Engagement (sections & scroll depth)**\n");
      lines.push("| Event | Count |\n| --- | ---: |");
      for (const event of events.slice(0, 12))
        lines.push(`| \`${event.path}\` | ${num(event.count)} |`);
      lines.push("");
    }
  } else {
    lines.push(
      "_Page / event breakdown unavailable (see workflow warning)._\n",
    );
  }

  try {
    const { stats = [] } = await gc(
      `/stats/locations?start=${START}&end=${END}`,
    );
    const top = stats.sort((a, b) => b.count - a.count).slice(0, 8);
    if (top.length) {
      lines.push("\n**Top countries**\n");
      lines.push("| Country | Visitors |\n| --- | ---: |");
      for (const country of top)
        lines.push(`| ${country.name ?? country.id} | ${num(country.count)} |`);
      lines.push("");
    }
  } catch (error) {
    warning("GoatCounter countries", error);
    lines.push(`_Country breakdown unavailable (${detail(error)})._\n`);
  }

  return lines.join("\n");
}

async function githubTrafficSection() {
  if (!REPO) return "";
  if (!GH_TRAFFIC_TOKEN) {
    return "\n_GitHub traffic unavailable (GH_TRAFFIC_TOKEN secret not configured)._\n";
  }

  try {
    const views = await gh(`/repos/${REPO}/traffic/views`, GH_TRAFFIC_TOKEN);
    const lines = [
      "\n**GitHub repo traffic (14-day window)**\n",
      `- Views: **${num(views.count)}** (**${num(views.uniques)}** unique)`,
    ];

    try {
      const clones = await gh(
        `/repos/${REPO}/traffic/clones`,
        GH_TRAFFIC_TOKEN,
      );
      lines.push(
        `- Clones: **${num(clones.count)}** (**${num(clones.uniques)}** unique)\n`,
      );
    } catch (error) {
      warning("GitHub clone traffic", error);
      lines.push(`- Clones: unavailable (${detail(error)})\n`);
    }

    return lines.join("\n");
  } catch (error) {
    warning("GitHub view traffic", error);
    return `\n_GitHub traffic unavailable (${detail(error)})._\n`;
  }
}

async function main() {
  const [analytics, traffic] = await Promise.all([
    goatcounterSection(),
    githubTrafficSection(),
  ]);

  const body = [
    `## 📊 Weekly site report`,
    `**Window:** ${START} → ${END}`,
    ``,
    `### Visitors`,
    analytics,
    `### Repository`,
    traffic,
    ``,
    `---`,
    `<sub>Generated automatically by \`weekly-report.yml\`. Data: GoatCounter + GitHub API.</sub>`,
  ].join("\n");

  if (!GH_TOKEN || !REPO) {
    console.log(body);
    return;
  }

  // Ensure the label exists (creating an issue with an unknown label 422s).
  await fetch(`https://api.github.com/repos/${REPO}/labels`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      name: "analytics",
      color: "79c6e4",
      description: "Automated site reports",
    }),
  }).catch(() => {});

  const title = `📊 Weekly analytics — ${START} → ${END}`;
  const res = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ title, body, labels: ["analytics"] }),
  });
  if (!res.ok) {
    console.error(`Failed to create issue: ${res.status} ${await res.text()}`);
    console.log(body);
    process.exit(1);
  }
  const issue = await res.json();
  console.log(`Report posted: ${issue.html_url}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
