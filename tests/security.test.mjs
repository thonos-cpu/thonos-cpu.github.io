import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');
const paths = (dir) =>
  readdirSync(join(root, dir)).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(join(root, path)).isDirectory() ? paths(path) : [path];
  });
const lock = JSON.parse(read('package-lock.json'));
const manifest = JSON.parse(read('package.json'));

test('lockfile matches declared dependencies', () => {
  assert.equal(lock.lockfileVersion, 3);
  assert.deepEqual(lock.packages[''].dependencies, manifest.dependencies);
  assert.deepEqual(lock.packages[''].devDependencies, manifest.devDependencies);
  for (const [name, entry] of Object.entries(lock.packages)) {
    if (!name || entry.link || !name.startsWith('node_modules/')) continue;
    if (entry.resolved?.startsWith('https://registry.npmjs.org/')) {
      assert.match(entry.integrity ?? '', /^sha(256|384|512)-/, name);
    }
    if (entry.resolved) {
      assert.ok(
        entry.resolved.startsWith('https://registry.npmjs.org/') ||
          entry.resolved.startsWith('file:'),
        'Unexpected dependency source: ' + name + ': ' + entry.resolved,
      );
    }
  }
});

test('workflow jobs enforce checks before publishing', () => {
  const ci = read('.github/workflows/ci.yml');
  const deploy = read('.github/workflows/deploy.yml');
  for (const workflow of [ci, deploy]) {
    assert.match(workflow, /npm ci/);
    assert.doesNotMatch(workflow, /npm install --no-package-lock/);
  }
  for (const command of ['format:check', 'npm run lint', 'npm run check', 'npm run build', 'test:security', 'test:site']) {
    assert.ok(ci.includes(command), 'CI missing ' + command);
  }
  assert.match(deploy, /needs: build/);
  assert.match(ci, /permissions:\s*\n\s*contents: read/);
});

test('browser playground requests match the worker protocol', () => {
  const worker = read('src/scripts/playground.worker.ts');
  const caller = read('src/components/Playground.astro');
  assert.match(worker, /trusted !== true/);
  assert.match(caller, /postMessage\(\{[^}]*trusted:\s*true[^}]*\}\)/s);
  assert.match(worker, /new Function\(/);
  assert.match(worker, /self\.postMessage\(/);
});

test('repository has no obvious committed secrets or private keys', () => {
  const scan = [...paths('src'), ...paths('scripts'), ...paths('.github')].filter((p) =>
    /\.(?:ts|astro|mjs|js|ya?ml|json)$/i.test(p),
  );
  for (const file of scan) {
    const data = read(file);
    assert.doesNotMatch(data, /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/);
    assert.doesNotMatch(data, /gh[pousr]_[A-Za-z0-9_]{30,}/);
    assert.doesNotMatch(data, /github_pat_[A-Za-z0-9_]{30,}/);
    assert.doesNotMatch(data, /AKIA[0-9A-Z]{16}/);
  }
});

test('GitHub security scanning is maintained', () => {
  const codeql = read('.github/workflows/codeql.yml');
  const ci = read('.github/workflows/ci.yml');
  assert.match(codeql, /security-and-quality/);
  assert.match(codeql, /pull_request:/);
  assert.match(ci, /dependency-review-action/);
  assert.match(ci, /npm audit --audit-level=high/);
});

test('frontend third-party links have external isolation policy', () => {
  const pages = paths('src').filter((f) => f.endsWith('.astro'));
  for (const file of pages) {
    const data = read(file);
    assert.doesNotMatch(data, /href=["']javascript:/i);
    assert.doesNotMatch(data, /src=["']javascript:/i);
  }
});