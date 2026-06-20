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
 *   GOATCOUNTER_CODE        e.g. "thonos"  (https://thonos.goatcounter.com)
 *   GOATCOUNTER_API_TOKEN   API token from GoatCounter → Settings → API
 *   GITHUB_TOKEN            provided automatically by Actions
 *   GITHUB_REPOSITORY       "owner/repo", provided automatically by Actions
 */

const GC_CODE = process.env.GOATCOUNTER_CODE || 'thonos';
const GC_TOKEN = process.env.GOATCOUNTER_API_TOKEN || '';
const GH_TOKEN = process.env.GITHUB_TOKEN || '';
const REPO = process.env.GITHUB_REPOSITORY || '';

const now = new Date();
const weekAgo = new Date(now.getTime() - 7 * 864e5);
const d = (x) => x.toISOString().slice(0, 10);
const START = d(weekAgo);
const END = d(now);

const num = (n) => new Intl.NumberFormat('en-GB').format(n ?? 0);

async function gc(path) {
  const res = await fetch(`https://${GC_CODE}.goatcounter.com/api/v0${path}`, {
    headers: { Authorization: `Bearer ${GC_TOKEN}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`GoatCounter ${path} → ${res.status}`);
  return res.json();
}

async function gh(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!res.ok) throw new Error(`GitHub ${path} → ${res.status}`);
  return res.json();
}

async function goatcounterSection() {
  if (!GC_TOKEN) return '> GoatCounter API token not configured — skipping visitor analytics.\n';
  const lines = [];
  try {
    const total = await gc(`/stats/total?start=${START}&end=${END}`);
    lines.push(`**${num(total.total)}** pageviews · **${num(total.total_events)}** events\n`);
  } catch (e) {
    lines.push(`_Totals unavailable (${e.message})._\n`);
  }

  try {
    const { hits = [] } = await gc(`/stats/hits?start=${START}&end=${END}&limit=50`);
    const pages = hits.filter((h) => !h.event).sort((a, b) => b.count - a.count);
    const events = hits.filter((h) => h.event).sort((a, b) => b.count - a.count);

    if (pages.length) {
      lines.push('\n**Top pages**\n');
      lines.push('| Page | Views |\n| --- | ---: |');
      for (const p of pages.slice(0, 8)) lines.push(`| \`${p.path}\` | ${num(p.count)} |`);
      lines.push('');
    }
    if (events.length) {
      lines.push('\n**Engagement (sections & scroll depth)**\n');
      lines.push('| Event | Count |\n| --- | ---: |');
      for (const e of events.slice(0, 12)) lines.push(`| \`${e.path}\` | ${num(e.count)} |`);
      lines.push('');
    }
  } catch (e) {
    lines.push(`_Page / event breakdown unavailable (${e.message})._\n`);
  }

  try {
    const { stats = [] } = await gc(`/stats/locations?start=${START}&end=${END}`);
    const top = stats.sort((a, b) => b.count - a.count).slice(0, 8);
    if (top.length) {
      lines.push('\n**Top countries**\n');
      lines.push('| Country | Visitors |\n| --- | ---: |');
      for (const c of top) lines.push(`| ${c.name ?? c.id} | ${num(c.count)} |`);
      lines.push('');
    }
  } catch (e) {
    lines.push(`_Country breakdown unavailable (${e.message})._\n`);
  }

  return lines.join('\n');
}

async function githubTrafficSection() {
  if (!REPO) return '';
  try {
    const views = await gh(`/repos/${REPO}/traffic/views`);
    const clones = await gh(`/repos/${REPO}/traffic/clones`).catch(() => ({
      count: 0,
      uniques: 0,
    }));
    return (
      `\n**GitHub repo traffic (14-day window)**\n\n` +
      `- Views: **${num(views.count)}** (**${num(views.uniques)}** unique)\n` +
      `- Clones: **${num(clones.count)}** (**${num(clones.uniques)}** unique)\n`
    );
  } catch (e) {
    return `\n_GitHub traffic unavailable (${e.message})._\n`;
  }
}

async function main() {
  const [analytics, traffic] = await Promise.all([goatcounterSection(), githubTrafficSection()]);

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
  ].join('\n');

  if (!GH_TOKEN || !REPO) {
    console.log(body);
    return;
  }

  // Ensure the label exists (creating an issue with an unknown label 422s).
  await fetch(`https://api.github.com/repos/${REPO}/labels`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({
      name: 'analytics',
      color: '79c6e4',
      description: 'Automated site reports',
    }),
  }).catch(() => {});

  const title = `📊 Weekly analytics — ${START} → ${END}`;
  const res = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ title, body, labels: ['analytics'] }),
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
