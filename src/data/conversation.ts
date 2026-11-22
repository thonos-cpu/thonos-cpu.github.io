import {
  CATEGORY_LABELS,
  conversationalAnswer,
  FACTS,
  GUARDRAILS,
  SUGGESTED_PROMPTS,
  type FactCategory,
  type PersonalFact,
  type SuggestedPrompt,
} from './knowledge';

export interface ConversationState {
  topic: FactCategory | null;
  seenFacts: string[];
  seenQueries: string[];
  turns: number;
}

export interface ConversationReply {
  answer: string;
  state: ConversationState;
  suggestions: SuggestedPrompt[];
}

const TOPICS: Partial<Record<FactCategory, string[]>> = {
  identity: [
    'who is he',
    'who is athanasios',
    'what does he do',
    'profile',
    'biography',
    'bio',
    'summary',
    'about him',
    'about athanasios',
  ],
  education: [
    'education',
    'university',
    'degree',
    'studies',
    'studied',
    'coursework',
    'courses',
    'patras',
    'ceid',
  ],
  experience: [
    'cern',
    'alice',
    'gsi',
    'internship',
    'intern',
    'experience',
    'employment',
    'worked',
    'employer',
    'teaching',
    'detector',
    'tpc',
  ],
  projects: [
    'project',
    'projects',
    'portfolio',
    'repository',
    'repositories',
    'repo',
    'repos',
    'built',
    'build',
    'chord',
    'dht',
    'search engine',
    'tf-idf',
    'tfidf',
    'forecasting',
    'thesis management',
  ],
  skills: [
    'skills',
    'skill',
    'stack',
    'technologies',
    'technology',
    'tools',
    'languages',
    'programming',
    'python',
    'c++',
    'sql',
    'linux',
  ],
  research: ['thesis', 'research', 'reinforcement learning', 'edge computing'],
  career: [
    'career',
    'role',
    'roles',
    'job',
    'jobs',
    'hiring',
    'hire',
    'fit',
    'looking for',
    'open to work',
  ],
  work_style: ['work style', 'debugging', 'debug', 'problem solving', 'approach'],
  achievements: ['award', 'awards', 'scholarship', 'hackathon', 'recognition'],
  contact: ['contact', 'email', 'linkedin', 'reach', 'book a call', 'get in touch'],
  website: ['website', 'site', 'astro', 'github pages'],
};

const STOP = new Set([
  'a',
  'an',
  'the',
  'is',
  'are',
  'was',
  'were',
  'do',
  'does',
  'did',
  'of',
  'to',
  'for',
  'in',
  'on',
  'at',
  'and',
  'or',
  'his',
  'he',
  'him',
  'you',
  'your',
  'me',
  'my',
  'i',
  'can',
  'could',
  'would',
  'what',
  'whats',
  'tell',
  'about',
  'please',
  'with',
  'how',
  'has',
  'have',
  'it',
  'this',
  'that',
  'any',
  'some',
  'give',
  'show',
  'there',
  'those',
  'them',
  'more',
  'else',
  'another',
  'other',
  'detail',
  'details',
  'athanasios',
  'tasis',
]);

const SYNONYMS: Record<string, string> = {
  jobs: 'job',
  roles: 'role',
  projects: 'project',
  repos: 'repo',
  repositories: 'repository',
  skills: 'skill',
  languages: 'language',
  tools: 'tool',
  technologies: 'technology',
  tech: 'technology',
  programming: 'language',
  studied: 'study',
  studies: 'study',
  worked: 'work',
  working: 'work',
  internships: 'internship',
  models: 'model',
  learning: 'learning',
  learnt: 'learn',
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9+#\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsPhrase(text: string, phrase: string): boolean {
  return (' ' + text + ' ').includes(' ' + normalize(phrase) + ' ');
}

function terms(value: string): string[] {
  return normalize(value)
    .split(' ')
    .map((term) => SYNONYMS[term] ?? term)
    .filter((term) => term.length > 1 && !STOP.has(term));
}

const INDEX = FACTS.map((fact) => ({
  fact,
  keywords: fact.keywords.map(normalize),
  title: new Set(terms(fact.title)),
  content: new Set(terms(fact.text)),
  keys: new Set(fact.keywords.flatMap(terms)),
}));

function categorySignals(query: string): [FactCategory, number][] {
  return Object.entries(TOPICS)
    .map(
      ([topic, phrases]) =>
        [
          topic as FactCategory,
          (phrases ?? []).reduce(
            (score, phrase) =>
              score + (containsPhrase(query, phrase) ? (phrase.includes(' ') ? 9 : 6) : 0),
            0,
          ),
        ] as [FactCategory, number],
    )
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);
}

function guardrail(query: string): string | null {
  for (const rule of GUARDRAILS) {
    if (rule.triggers.some((trigger) => containsPhrase(query, trigger))) return rule.response;
  }
  return null;
}

function getTopic(query: string, state: ConversationState): FactCategory | null {
  const signals = categorySignals(query);
  const pointsBack = /\b(it|that|there|those|them|this|previous|earlier)\b/.test(query);
  const followUp =
    /^(and|more|what else|anything else|tell me more|elaborate|expand|details|another|other)\b/.test(
      query,
    );
  if (state.topic && pointsBack && signals.every(([topic]) => topic === 'skills'))
    return state.topic;
  if (state.topic && (followUp || pointsBack) && signals.length === 0) return state.topic;
  return signals[0]?.[0] ?? null;
}

function scoreFact(
  query: string,
  queryTerms: string[],
  topic: FactCategory | null,
  item: (typeof INDEX)[number],
): number {
  const { fact, keywords, title, content, keys } = item;
  let score = topic && fact.category === topic ? 24 : 0;
  if (topic && fact.category !== topic) return 0;
  for (const keyword of keywords) {
    if (keyword && containsPhrase(query, keyword)) score += 22 + keyword.split(' ').length * 3;
  }
  for (const term of queryTerms) {
    if (title.has(term)) score += 13;
    if (keys.has(term)) score += 10;
    if (content.has(term)) score += 2;
  }
  if (score <= (topic ? 24 : 0)) return 0;
  return score + (fact.priority ?? 0) / 5;
}

function selectFacts(
  query: string,
  topic: FactCategory | null,
  state: ConversationState,
): PersonalFact[] {
  const queryTerms = terms(query);
  const followUp = /\b(more|else|another|other|expand|elaborate|details)\b/.test(query);
  const previousId = state.seenFacts.at(-1);
  const relatedPrefix = followUp && previousId?.startsWith('cern-') ? 'cern-' : null;
  const matches = INDEX.filter((item) => !relatedPrefix || item.fact.id.startsWith(relatedPrefix))
    .map((item) => ({
      fact: item.fact,
      score: scoreFact(query, queryTerms, topic, item),
    }))
    .filter((item) => item.score >= (topic ? 25 : 12))
    .sort((a, b) => b.score - a.score);

  if (!matches.length && topic) {
    const available = FACTS.filter(
      (fact) =>
        fact.category === topic &&
        !state.seenFacts.includes(fact.id) &&
        (!relatedPrefix || fact.id.startsWith(relatedPrefix)),
    );
    return available.slice(0, 1);
  }

  const fresh = matches.filter(({ fact }) => !state.seenFacts.includes(fact.id));
  const wantMore = followUp;
  const duplicate = state.seenQueries.includes(query);
  if ((wantMore || duplicate) && !fresh.length) return [];
  const candidates = fresh.length ? fresh : matches;
  const broad = /\b(all|list|overview|stack|skills|projects)\b/.test(query) && !wantMore;
  return candidates.slice(0, broad ? 2 : 1).map((item) => item.fact);
}

function suggestionsFor(state: ConversationState): SuggestedPrompt[] {
  return SUGGESTED_PROMPTS.filter((prompt) => {
    const query = normalize(prompt.query);
    const topic = getTopic(query, { topic: null, seenFacts: [], seenQueries: [], turns: 0 });
    return (
      !state.seenQueries.includes(query) &&
      (!topic ||
        !state.seenFacts.some((id) =>
          FACTS.some((fact) => fact.id === id && fact.category === topic),
        ))
    );
  }).slice(0, 3);
}

export function createConversationState(): ConversationState {
  return { topic: null, seenFacts: [], seenQueries: [], turns: 0 };
}

export function respondToUser(question: string, current: ConversationState): ConversationReply {
  const query = normalize(question).slice(0, 500);
  const state: ConversationState = {
    topic: current.topic,
    seenFacts: [...current.seenFacts],
    seenQueries: [...current.seenQueries],
    turns: current.turns + 1,
  };

  const safetyResponse = guardrail(query);
  if (safetyResponse) return { answer: safetyResponse, state, suggestions: suggestionsFor(state) };

  if (/^(hi|hey|hello|yo|hiya|good morning|good afternoon|good evening)[!. ]*$/.test(query)) {
    return {
      answer:
        state.turns === 1
          ? "Hey! I'm Athanasios's portfolio assistant. Curious about his projects, experience, or what he works with?"
          : 'Hey again! What would you like to know?',
      state,
      suggestions: suggestionsFor(state),
    };
  }
  if (/^(thanks|thank you|thx|cheers)[!. ]*$/.test(query)) {
    return {
      answer: state.turns > 2 ? 'Of course! Happy to help.' : "You're welcome!",
      state,
      suggestions: suggestionsFor(state),
    };
  }
  if (/^(how are you|how s it going|whats up|what s up)[!. ]*$/.test(query)) {
    return {
      answer:
        'Doing well, thanks for asking! Want to hear about something Athanasios has been working on?',
      state,
      suggestions: suggestionsFor(state),
    };
  }
  if (/^(help|what can i ask|capabilities)$/.test(query)) {
    return {
      answer:
        'I can help you explore his work, from CERN and distributed systems to his thesis and favorite technical tools. You can ask naturally, including follow-up questions.',
      state,
      suggestions: suggestionsFor(state),
    };
  }

  const topic = getTopic(query, state);
  const facts = selectFacts(query, topic, state);
  let answer: string;

  if (facts.length) {
    answer = conversationalAnswer(question, facts);
    for (const fact of facts) if (!state.seenFacts.includes(fact.id)) state.seenFacts.push(fact.id);
    state.topic = topic ?? facts[0].category;
  } else if (
    topic &&
    (state.seenQueries.includes(query) ||
      /\b(more|else|another|other|expand|elaborate|details)\b/.test(query))
  ) {
    const subject = CATEGORY_LABELS[topic]?.toLowerCase() ?? 'that topic';
    answer = `We've covered the main details about his ${subject} so far. I don't want to repeat myself, but you can ask about a specific part of it.`;
  } else {
    answer =
      state.turns > 1
        ? "I'm not sure I have that detail in his public portfolio. I can still help with his experience, projects, or technical work."
        : "I don't have a reliable answer to that in his portfolio, but I can tell you about his projects, experience, and technical background.";
  }

  if (query && !state.seenQueries.includes(query)) state.seenQueries.push(query);
  state.seenQueries = state.seenQueries.slice(-30);
  state.seenFacts = state.seenFacts.slice(-40);

  return { answer, state, suggestions: suggestionsFor(state) };
}

export function initialSuggestions(): SuggestedPrompt[] {
  return SUGGESTED_PROMPTS.slice(0, 5);
}
