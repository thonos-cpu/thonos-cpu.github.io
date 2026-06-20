/**
 * Build-time GitHub data layer.
 *
 * This module runs ONLY during `astro build` / `astro dev` (never in the browser).
 * It pulls the profile, repositories, languages and rendered READMEs from the
 * GitHub REST API, then bakes everything into static output. Visitors therefore
 * never hit the GitHub API directly — the site is plain static files and can
 * never be rate-limited or broken by the API being slow.
 *
 * Auth: set GITHUB_TOKEN to lift the rate limit from 60/h to ~5000/h. In CI the
 * built-in `secrets.GITHUB_TOKEN` is used automatically. Locally the module
 * falls back to unauthenticated requests and an on-disk cache.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import sanitizeHtml from 'sanitize-html';

const USERNAME = 'thonos-cpu';
const API = 'https://api.github.com';
const CACHE_FILE = resolve(process.cwd(), '.cache/github.json');
const CACHE_TTL_MS = 1000 * 60 * 60; // 1h locally; CI always fetches fresh
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const IS_CI = process.env.CI === 'true';

/** Repos that are infrastructure, not portfolio pieces. */
const HIDDEN_REPOS = new Set([`${USERNAME}.github.io`, USERNAME]);

export interface RepoLanguage {
  name: string;
  bytes: number;
  pct: number;
}

export interface Repo {
  name: string;
  slug: string;
  description: string | null;
  url: string;
  homepage: string | null;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  language: string | null;
  languages: RepoLanguage[];
  topics: string[];
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  size: number;
  isFork: boolean;
  isArchived: boolean;
  readmeHtml: string | null;
}

export interface Profile {
  login: string;
  name: string;
  avatarUrl: string;
  bio: string | null;
  company: string | null;
  blog: string | null;
  htmlUrl: string;
  followers: number;
  following: number;
  publicRepos: number;
  createdAt: string;
}

export interface GitHubData {
  profile: Profile;
  repos: Repo[];
  stats: {
    totalStars: number;
    totalForks: number;
    totalRepos: number;
    accountAgeYears: number;
    languages: RepoLanguage[];
  };
  fetchedAt: string;
}

function headers(accept = 'application/vnd.github+json'): Record<string, string> {
  const h: Record<string, string> = {
    Accept: accept,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': `${USERNAME}-portfolio-build`,
  };
  if (TOKEN) h.Authorization = `Bearer ${TOKEN}`;
  return h;
}

async function gh<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { headers: headers() });
  if (!res.ok) {
    const remaining = res.headers.get('x-ratelimit-remaining');
    throw new Error(
      `GitHub API ${res.status} for ${path}` +
        (remaining === '0' ? ' — rate limit exhausted (set GITHUB_TOKEN).' : ''),
    );
  }
  return (await res.json()) as T;
}

/** Render Markdown to HTML using GitHub's own renderer, then sanitise it. */
async function renderReadme(repoName: string): Promise<string | null> {
  // 1. Fetch the raw README (any conventional filename/casing).
  let raw: string | null = null;
  try {
    const meta = await gh<{ content: string; encoding: string }>(
      `/repos/${USERNAME}/${repoName}/readme`,
    );
    raw = Buffer.from(meta.content, meta.encoding as BufferEncoding).toString('utf8');
  } catch {
    return null;
  }
  if (!raw.trim()) return null;

  // 2. Render via GitHub's GFM endpoint so it looks exactly like github.com.
  let html: string;
  try {
    const res = await fetch(`${API}/markdown`, {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: raw, mode: 'gfm', context: `${USERNAME}/${repoName}` }),
    });
    if (!res.ok) throw new Error(String(res.status));
    html = await res.text();
  } catch {
    return null;
  }

  // 3. Sanitise and resolve relative asset/links to absolute GitHub URLs.
  const rawBase = `https://raw.githubusercontent.com/${USERNAME}/${repoName}/HEAD/`;
  const blobBase = `https://github.com/${USERNAME}/${repoName}/blob/HEAD/`;
  const isAbsolute = (u: string) => /^(https?:|mailto:|#|data:)/i.test(u);

  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'img',
      'h1',
      'h2',
      'details',
      'summary',
      'figure',
      'figcaption',
      'picture',
      'source',
      'kbd',
      'sup',
      'sub',
      'del',
      'ins',
      'mark',
    ]),
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel', 'title'],
      img: ['src', 'alt', 'title', 'width', 'height', 'align', 'loading'],
      source: ['srcset', 'media', 'type'],
      '*': ['id', 'class', 'align', 'colspan', 'rowspan', 'start', 'dir', 'aria-hidden'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'data'],
    transformTags: {
      a: (tagName, attribs) => {
        if (attribs.href && !isAbsolute(attribs.href)) {
          attribs.href = blobBase + attribs.href.replace(/^\.?\//, '');
        }
        attribs.rel = 'noopener noreferrer';
        attribs.target = '_blank';
        return { tagName, attribs };
      },
      img: (tagName, attribs) => {
        if (attribs.src && !isAbsolute(attribs.src)) {
          attribs.src = rawBase + attribs.src.replace(/^\.?\//, '');
        }
        attribs.loading = 'lazy';
        return { tagName, attribs };
      },
    },
  });
}

function buildLanguageList(map: Record<string, number>): RepoLanguage[] {
  const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(map)
    .map(([name, bytes]) => ({ name, bytes, pct: (bytes / total) * 100 }))
    .sort((a, b) => b.bytes - a.bytes);
}

async function fetchFresh(): Promise<GitHubData> {
  const user = await gh<Record<string, unknown>>(`/users/${USERNAME}`);
  const rawRepos = await gh<Record<string, unknown>[]>(
    `/users/${USERNAME}/repos?per_page=100&sort=updated`,
  );

  const candidates = rawRepos.filter(
    (r) => !r.fork && !HIDDEN_REPOS.has(String(r.name)) && !r.private,
  );

  const repos: Repo[] = [];
  const globalLang: Record<string, number> = {};

  for (const r of candidates) {
    const name = String(r.name);
    const langMap = await gh<Record<string, number>>(`/repos/${USERNAME}/${name}/languages`).catch(
      () => ({}) as Record<string, number>,
    );
    for (const [k, v] of Object.entries(langMap)) globalLang[k] = (globalLang[k] || 0) + v;

    const readmeHtml = await renderReadme(name);

    repos.push({
      name,
      slug: name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
      description: (r.description as string) ?? null,
      url: String(r.html_url),
      homepage: (r.homepage as string) || null,
      stars: Number(r.stargazers_count) || 0,
      forks: Number(r.forks_count) || 0,
      watchers: Number(r.watchers_count) || 0,
      openIssues: Number(r.open_issues_count) || 0,
      language: (r.language as string) ?? null,
      languages: buildLanguageList(langMap),
      topics: (r.topics as string[]) ?? [],
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
      pushedAt: String(r.pushed_at),
      size: Number(r.size) || 0,
      isFork: Boolean(r.fork),
      isArchived: Boolean(r.archived),
      readmeHtml,
    });
  }

  const profile: Profile = {
    login: String(user.login),
    name: String(user.name || USERNAME),
    avatarUrl: String(user.avatar_url),
    bio: (user.bio as string) ?? null,
    company: (user.company as string) ?? null,
    blog: (user.blog as string) || null,
    htmlUrl: String(user.html_url),
    followers: Number(user.followers) || 0,
    following: Number(user.following) || 0,
    publicRepos: Number(user.public_repos) || 0,
    createdAt: String(user.created_at),
  };

  const totalStars = repos.reduce((a, r) => a + r.stars, 0);
  const totalForks = repos.reduce((a, r) => a + r.forks, 0);
  const accountAgeYears =
    (Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 365.25);

  return {
    profile,
    repos,
    stats: {
      totalStars,
      totalForks,
      totalRepos: repos.length,
      accountAgeYears: Math.round(accountAgeYears * 10) / 10,
      languages: buildLanguageList(globalLang),
    },
    fetchedAt: new Date().toISOString(),
  };
}

async function readCache(): Promise<GitHubData | null> {
  if (!existsSync(CACHE_FILE)) return null;
  try {
    // Freshness is decided by the caller; this just loads whatever is on disk.
    return JSON.parse(await readFile(CACHE_FILE, 'utf8')) as GitHubData;
  } catch {
    return null;
  }
}

async function writeCache(data: GitHubData): Promise<void> {
  try {
    await mkdir(dirname(CACHE_FILE), { recursive: true });
    await writeFile(CACHE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch {
    /* cache is best-effort */
  }
}

let memo: Promise<GitHubData> | null = null;

/** Singleton accessor — fetched once per build, memoised across pages. */
export function getGitHubData(): Promise<GitHubData> {
  if (memo) return memo;
  memo = (async () => {
    // Use a warm cache only in local dev (never in CI).
    if (!IS_CI) {
      const cached = await readCache();
      if (cached && Date.now() - new Date(cached.fetchedAt).getTime() < CACHE_TTL_MS) {
        return cached;
      }
    }
    try {
      const fresh = await fetchFresh();
      await writeCache(fresh);
      return fresh;
    } catch (err) {
      // Network/rate-limit failure: fall back to any cache rather than break the build.
      const cached = await readCache();
      if (cached) {
        console.warn(`[github] live fetch failed, using cached data: ${(err as Error).message}`);
        return cached;
      }
      throw err;
    }
  })();
  return memo;
}
