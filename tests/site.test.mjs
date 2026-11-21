import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import test from 'node:test';

const dist = resolve('dist');
const files = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const file = join(dir, name);
    return statSync(file).isDirectory() ? files(file) : [file];
  });

const htmlFiles = files(dist).filter((file) => file.endsWith('.html') && !/\/google[^/]*\.html$/.test(file));
const attrs = (tag) => {
  const parsed = {};
  for (const match of tag.matchAll(/([a-z][\w:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    parsed[match[1].toLowerCase()] = match[2] ?? match[3];
  }
  return parsed;
};

const localPath = (url, page) => {
  if (!url || url.startsWith('#') || /^([a-z][\w+.-]*:)?\/\//i.test(url)) return null;
  if (/^(mailto:|tel:|data:)/i.test(url)) return null;
  const path = decodeURIComponent(url.split(/[?#]/)[0]);
  if (!path) return null;
  const target = path.startsWith('/') ? resolve(dist, '.' + path) : resolve(page, '..', path);
  assert.ok(target === dist || target.startsWith(dist + sep), 'Path escapes output: ' + url);
  return target;
};

test('static build produces the expected entry points', () => {
  assert.ok(htmlFiles.length >= 3, 'Expected homepage and project pages');
  for (const path of ['index.html', 'playground/index.html', 'robots.txt']) {
    assert.ok(existsSync(join(dist, path)), 'Missing ' + path);
  }
});

test('all built pages contain basic metadata and safe links', () => {
  for (const page of htmlFiles) {
    const html = readFileSync(page, 'utf8');
    assert.match(html, /<title>[^<]+<\/title>/i, page);
    assert.match(html, /<html\b[^>]*lang=/i, page);
    assert.match(html, /<meta\b[^>]*name="description"/i, page);
    for (const tag of html.match(/<(?:a|img|script|link|source)\b[^>]*>/gi) ?? []) {
      const attr = attrs(tag);
      for (const key of ['href', 'src']) {
        if (!attr[key]) continue;
        assert.doesNotMatch(attr[key], /^\s*javascript:/i, page);
        const target = localPath(attr[key], page);
        if (target) {
          assert.ok(
            existsSync(target) ||
              existsSync(target + '.html') ||
              existsSync(join(target, 'index.html')),
            'Broken local asset/link in ' + page + ': ' + attr[key],
          );
        }
      }
      if (/^<a\b/i.test(tag) && attr.target === '_blank') {
        assert.match(attr.rel ?? '', /\bnoopener\b/i, 'External link missing noopener in ' + page);
      }
      if (/^<img\b/i.test(tag)) assert.ok(attr.alt !== undefined, 'Image missing alt in ' + page);
    }
  }
});

test('no accidental credentials or private keys are shipped', () => {
  for (const file of files(dist).filter((p) => /\.(?:html|js|css|json|txt|xml)$/i.test(p))) {
    const data = readFileSync(file, 'utf8');
    assert.doesNotMatch(data, /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/, file);
    assert.doesNotMatch(data, /github_pat_[A-Za-z0-9_]{30,}/, file);
    assert.doesNotMatch(data, /gh[pousr]_[A-Za-z0-9_]{30,}/, file);
  }
});
