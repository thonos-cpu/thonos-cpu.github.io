import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const knowledge = readFileSync('src/data/knowledge.ts', 'utf8');
const conversation = readFileSync('src/data/conversation.ts', 'utf8');
const compiledKnowledge = ts.transpileModule(knowledge, {
  fileName: 'knowledge.ts',
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const compiledConversation = ts
  .transpileModule(conversation, {
    fileName: 'conversation.ts',
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  })
  .outputText.replace("from './knowledge'", "from './knowledge.js'");
const dataUrl = 'data:text/javascript;base64,' + Buffer.from(compiledKnowledge).toString('base64');
const moduleText = compiledConversation.replace(
  "from './knowledge.js'",
  'from ' + JSON.stringify(dataUrl),
);
const bot = await import(
  'data:text/javascript;base64,' + Buffer.from(moduleText).toString('base64')
);

function chat(...queries) {
  let state = bot.createConversationState();
  const replies = [];
  for (const query of queries) {
    const result = bot.respondToUser(query, state);
    replies.push(result.answer);
    state = result.state;
  }
  return { replies, state };
}

test('initial suggestions and replies are available locally', () => {
  assert.ok(bot.initialSuggestions().length > 0);
  const { replies } = chat('Who is he?');
  assert.match(replies[0], /Athanasios/);
});

test('specific project questions select the right project', () => {
  const { replies } = chat('Tell me about his TF-IDF search engine');
  assert.match(replies[0], /TF-IDF/i);
});

test('follow-up requests reveal new facts instead of repeating previous answers', () => {
  const { replies } = chat('What did he do at CERN?', 'Tell me more', 'More details');
  assert.match(replies[0], /ALICE|CERN/);
  assert.notEqual(replies[0], replies[1]);
  assert.notEqual(replies[1], replies[2]);
});

test('repeated exact questions do not repeat the same answer', () => {
  const { replies } = chat('What is his thesis about?', 'What is his thesis about?');
  assert.notEqual(replies[0], replies[1]);
  assert.match(replies[1], /covered the main details/);
});

test('switching subjects changes conversational context', () => {
  const { replies, state } = chat('What did he do at CERN?', 'What about his education?');
  assert.match(replies[1], /University of Patras/);
  assert.equal(state.topic, 'education');
});

test('guardrails handle sensitive data without substring false positives', () => {
  const privateReply = chat('What is his private home address?').replies[0];
  assert.match(privateReply, /private contact/);
  const ordinaryReply = chat('What work experience does he have?').replies[0];
  assert.doesNotMatch(ordinaryReply, /medical|health|relationship/);
});

test('out-of-scope requests do not fabricate facts', () => {
  const { replies } = chat('Who will win the next election?');
  assert.match(replies[0], /professional background|professional information|only answer/);
});

test('all local responses are bounded and suggestions shrink as topics are covered', () => {
  const { replies, state } = chat('What are his projects?', 'Tell me more', 'Tell me more');
  for (const reply of replies) {
    assert.ok(reply.length > 0);
    assert.ok(reply.length < 1100);
  }
  assert.ok(state.seenFacts.length > 0);
  assert.ok(state.seenQueries.length > 0);
});

test('greetings and small talk feel conversational', () => {
  const { replies } = chat('hi', 'How are you?', 'thanks', 'hi');
  assert.match(replies[0], /hey/i);
  assert.match(replies[0], /what|curious/i);
  assert.doesNotMatch(replies[0], /^Ask about Athanasios Tasis/);
  assert.match(replies[1], /doing well/i);
  assert.match(replies[2], /happy to help/i);
  assert.notEqual(replies[0], replies[3]);
});

test('different professional questions have natural direct answers', () => {
  const prompts = ['What is his thesis?', 'What projects has he built?', 'How do I contact him?'];
  const { replies } = chat(...prompts);
  assert.match(replies[0], /thesis/i);
  assert.match(replies[1], /project/i);
  assert.match(replies[2], /athanasios@tasis.info/);
  for (const answer of replies) {
    assert.doesNotMatch(answer, /^Ask about Athanasios Tasis/);
    assert.ok(answer.length < 1100);
  }
});

test('small talk does not trigger unrelated facts or leak secrets', () => {
  const { replies } = chat('hello', 'thanks', 'How are you?', 'What is his private home address?');
  assert.doesNotMatch(replies.slice(0, 3).join(' '), /Pastry-style|Time Projection Chamber/);
  assert.match(replies[3], /private contact/i);
});
