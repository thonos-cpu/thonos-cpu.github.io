import assert from 'node:assert/strict';
import { readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

process.env.CI = 'true';
delete process.env.GITHUB_TOKEN;
delete process.env.GH_TOKEN;

const base = 'https://api.github.com';
const defaultUser = {
  login: 'thonos-cpu',
  name: 'Test Profile',
  avatar_url: 'https://avatars.githubusercontent.com/u/1',
  bio: null,
  company: null,
  blog: null,
  html_url: 'https://github.com/thonos-cpu',
  followers: 3,
  following: 2,
  public_repos: 1,
  created_at: '2020-01-01T00:00:00Z',
};
const repo = {
  name: 'example-repo',
  html_url: 'https://github.com/thonos-cpu/example-repo',
  description: 'Example',
  homepage: null,
  stargazers_count: 10,
  forks_count: 2,
  watchers_count: 1,
  open_issues_count: 0,
  language: 'JavaScript',
  topics: ['test'],
  created_at: '2020-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  pushed_at: '2026-01-01T00:00:00Z',
  size: 12,
  fork: false,
  private: false,
  archived: false,
};

const raw = '# Test README';
const malicious = [
  '<script>window.infected = true</script>',
  '<img src="x" onerror="alert(1)">',
  '<a href="javascript:alert(1)">click</a>',
  '<svg onload="alert(1)"></svg>',
  '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
].join('');

function mockGitHub(markdown = malicious) {
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push([String(url), options]);
    const path = String(url).replace(base, '');
    if (path === '/users/thonos-cpu') return Response.json(defaultUser);
    if (path.startsWith('/users/thonos-cpu/repos?')) return Response.json([repo]);
    if (path === '/repos/thonos-cpu/example-repo/languages')
      return Response.json({ JavaScript: 800 });
    if (path === '/repos/thonos-cpu/example-repo/readme') {
      return Response.json({ content: Buffer.from(raw).toString('base64'), encoding: 'base64' });
    }
    if (path === '/markdown') return new Response(markdown, { status: 200 });
    return new Response('Not found', { status: 404 });
  };
  return calls;
}

test('fetches GitHub profile and sanitizes untrusted README HTML', async () => {
  const originalFetch = globalThis.fetch;
  await rm(resolve('.cache/github.json'), { force: true });
  try {
    const calls = mockGitHub();
    const { getGitHubData } = await import('../../src/lib/github.ts?security=' + Date.now());
    const data = await getGitHubData();
    assert.equal(data.repos.length, 1);
    assert.equal(data.repos[0].stars, 10);
    assert.equal(data.repos[0].languages[0].pct, 100);
    assert.equal(data.stats.totalStars, 10);
    const html = data.repos[0].readmeHtml ?? '';
    assert.doesNotMatch(html, /<script|<svg|<iframe|onerror=/i);
    assert.doesNotMatch(html, /href="javascript:/i);
    assert.ok(calls.some(([url]) => url.endsWith('/markdown')));
    assert.ok((await readFile('.cache/github.json', 'utf8')).includes('example-repo'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('returns cached data when GitHub API is unavailable', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () =>
      new Response('rate limited', {
        status: 429,
        headers: { 'x-ratelimit-remaining': '0' },
      });
    const { getGitHubData } = await import('../../src/lib/github.ts?fallback=' + Date.now());
    const data = await getGitHubData();
    assert.equal(data.repos[0].name, 'example-repo');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('README sanitizer rejects common HTML injection payloads', async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (let i = 0; i < 12; i++) {
      const candidate = [
        '<img src=x onerror=alert(1)>',
        '<iframe src=evil></iframe>',
        '<script>alert(1)</script>',
        '<svg><animate onbegin=alert(1)></animate></svg>',
        '<a href="javascript:alert(1)">a</a>',
        '<a href="data:text/html,<script>alert(1)</script>">b</a>',
      ][i % 6];
      mockGitHub(candidate);
      const { getGitHubData } = await import('../../src/lib/github.ts?fuzz=' + i);
      const data = await getGitHubData();
      const html = data.repos[0].readmeHtml ?? '';
      assert.doesNotMatch(html, /<script\b|<iframe\b|<svg\b|onerror=|onbegin=/i);
      assert.doesNotMatch(html, /href="(?:javascript|data):/i);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});
