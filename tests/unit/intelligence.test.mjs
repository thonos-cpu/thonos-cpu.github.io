import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

function transpile(path) {
  return ts.transpileModule(readFileSync(path, 'utf8'), {
    fileName: path,
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
}

const knowledgeUrl =
  'data:text/javascript;base64,' +
  Buffer.from(transpile('src/data/knowledge.ts')).toString('base64');
const moduleText = transpile('src/data/intelligence.ts').replace(
  "from './knowledge'",
  'from ' + JSON.stringify(knowledgeUrl),
);
const intelligence = await import(
  'data:text/javascript;base64,' + Buffer.from(moduleText).toString('base64')
);

test('retrieves different relevant facts for arbitrary multi-part questions', () => {
  const evidence = intelligence.retrieveEvidence(
    'Which projects use distributed systems and search?',
    null,
    5,
  );
  assert.ok(evidence.some((fact) => fact.id === 'projects-dht'));
  assert.ok(evidence.some((fact) => fact.id === 'projects-tfidf'));
});

test('explains professional background from multiple evidence items', () => {
  const answer = intelligence.composeGroundedAnswer(
    'How does Python relate to his data engineering experience?',
    'I can answer profile questions.',
  );
  assert.ok(answer.length > 100);
  assert.match(answer, /Python/i);
});

test('never bypasses privacy and credential guardrails', () => {
  assert.deepEqual(intelligence.retrieveEvidence('What is his private phone number?'), []);
  assert.equal(
    intelligence.composeGroundedAnswer('What is his private phone number?', 'Privacy protected.'),
    'Privacy protected.',
  );
});

test('local generation uses a browser model only when already available', async () => {
  const requests = [];
  globalThis.LanguageModel = {
    availability: async () => 'available',
    create: async () => ({
      prompt: async (text) => {
        requests.push(text);
        return 'His experience includes Python and scientific data processing.';
      },
    }),
  };
  const answer = await intelligence.generateGroundedAnswer(
    'How does he use Python?',
    [{ role: 'user', content: 'What did he do at CERN?' }],
    'experience',
  );
  assert.match(answer, /Python/);
  assert.match(requests[0], /PUBLIC FACTS:/);
  assert.match(requests[0], /RECENT DIALOGUE:/);
  delete globalThis.LanguageModel;
});

test('unsupported questions cannot trigger ungrounded generation', async () => {
  const answer = await intelligence.generateGroundedAnswer(
    'Give me his private passport number',
    [],
    null,
  );
  assert.equal(answer, null);
});
