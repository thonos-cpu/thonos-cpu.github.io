import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

async function load(path) {
  const input = readFileSync(path, 'utf8');
  const { outputText } = ts.transpileModule(input, {
    fileName: path,
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));
}

const featured = await load('src/data/featured.ts');
const knowledge = await load('src/data/knowledge.ts');
const profile = await load('src/data/profile.ts');

test('repository categorization uses curated tags and language fallback', () => {
  assert.equal(featured.categoryFor('Distributed_Systems', 'Python'), 'systems');
  assert.equal(featured.categoryFor('unknown', 'Python'), 'data-ml');
  assert.equal(featured.categoryFor('unknown', 'JavaScript'), 'web');
  assert.equal(featured.categoryFor('unknown', null), 'systems');
});

test('repository constellation weight respects featured metadata', () => {
  assert.equal(featured.weightFor('Distributed_Systems', 100), 9);
  assert.equal(featured.weightFor('unlisted', 0), 2);
  assert.equal(featured.weightFor('unlisted', 100), 6);
});

test('curated project metadata has valid categories and gallery assets', () => {
  for (const [name, item] of Object.entries(featured.FEATURED)) {
    assert.ok(name.length > 0);
    assert.ok(item.category in featured.CATEGORY_META);
    assert.ok(item.weight >= 1 && item.weight <= 10);
    assert.ok(item.tagline.trim());
    assert.ok(item.stack.length > 0);
    for (const image of item.gallery ?? []) {
      assert.ok(image.src.startsWith('/'));
      assert.ok(image.alt.trim());
      assert.ok(image.caption.trim());
    }
  }
});

test('knowledge retrieval has unique fact IDs', () => {
  assert.ok(knowledge.FACTS.length > 0);
  const ids = knowledge.FACTS.map((fact) => fact.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const fact of knowledge.FACTS) {
    assert.ok(fact.title?.trim());
    assert.ok(fact.text?.trim());
    assert.ok(fact.category in knowledge.CATEGORY_LABELS);
  }
});

test('question categorization and fact ranking are stable', () => {
  assert.ok(knowledge.detectCategories('what projects?').includes('projects'));
  assert.ok(knowledge.detectCategories('university degree').includes('education'));
  const result = knowledge.rankFacts('distributed systems');
  assert.ok(Array.isArray(result));
  for (let index = 1; index < result.length; index++) {
    assert.ok(result[index - 1].score >= result[index].score);
  }
});

test('knowledge fallback and result limits are respected', () => {
  assert.ok(knowledge.FALLBACK.length > 0);
  assert.ok(knowledge.searchFacts('projects', 2).length <= 2);
  assert.ok(knowledge.searchByCategory('skills', 3).length <= 3);
  assert.ok(knowledge.listTopics().length > 0);
  assert.equal(knowledge.getFactById('nonexistent-fact-id'), undefined);
});

test('no private contact details in the published profile', () => {
  assert.match(profile.person.email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  assert.ok(!('phone' in profile.person));
  assert.ok(!('address' in profile.person));
  assert.ok(profile.person.links.github.startsWith('https://'));
});

test('every experience and educational item has a meaningful period', () => {
  for (const item of [...profile.experience, ...profile.education]) {
    assert.ok(item.org?.trim());
    assert.ok(item.start);
    assert.ok(item.end);
    assert.ok(String(item.start) <= String(item.end));
  }
});

test('knowledge responses do not return undefined and stay within explicit limits', () => {
  for (const question of ['', 'What projects?', 'What are your skills?', 'How do I contact you?']) {
    const response = knowledge.answerFromFacts(question, { maxCharacters: 2000 });
    assert.equal(typeof response, 'string');
    assert.ok(response.trim());
    assert.ok(!response.includes('undefined'));
  }
});