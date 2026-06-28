import factsData from './facts.json';
import kbData from './kb.json';
export interface KBEntry {
  id: string;
  q: string[];
  a: string;
}

export type FactCategory =
  | 'identity'
  | 'education'
  | 'experience'
  | 'projects'
  | 'skills'
  | 'research'
  | 'career'
  | 'work_style'
  | 'interview'
  | 'contact'
  | 'guardrail'
  | 'website'
  | 'personality'
  | 'availability'
  | 'achievements'
  | 'technical_opinion';

export interface PersonalFact {
  id: string;
  category: FactCategory;
  title: string;
  text: string;
  keywords: string[];
  priority?: number;
}

export interface GuardrailRule {
  id: string;
  triggers: string[];
  response: string;
}

export interface SuggestedPrompt {
  label: string;
  query: string;
}

export interface RetrievalResult {
  fact: PersonalFact;
  score: number;
}

export interface AnswerOptions {
  maxFacts?: number;
  maxCharacters?: number;
  includeTitles?: boolean;
}

export const BOT_NAME = 'ThanosGPT';

export const BOT_INTRO =
  "Hi — I'm ThanosGPT. Ask me about Athanasios Tasis: his work, projects, technical background, career direction, or how to contact him.";

export const FALLBACK =
  'I can answer questions about Athanasios Tasis: his education, CERN/ALICE work, projects, skills, research interests, work style, career goals and professional contact details. I do not answer unrelated questions or share private personal information.';

export const SUGGESTIONS = [
  'What does he do?',
  'Tell me about his CERN work',
  'What are his strongest projects?',
  "What's his tech stack?",
  'What roles is he looking for?',
  'Why should we hire him?',
  'What is his thesis about?',
  'How does he solve problems?',
  'How can I contact him?',
];

export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    label: 'Profile',
    query: 'Give me a short profile of Athanasios.',
  },
  {
    label: 'CERN',
    query: 'What exactly did he do at CERN ALICE?',
  },
  {
    label: 'Projects',
    query: 'What are his best technical projects?',
  },
  {
    label: 'Data Engineering',
    query: 'Why is he a good fit for data engineering?',
  },
  {
    label: 'AI/ML',
    query: 'What AI and machine-learning experience does he have?',
  },
  {
    label: 'Systems',
    query: 'What distributed-systems experience does he have?',
  },
  {
    label: 'Interview',
    query: 'Why should we hire him?',
  },
  {
    label: 'Thesis',
    query: 'What is his thesis about?',
  },
  {
    label: 'Work Style',
    query: 'How does he solve difficult problems?',
  },
  {
    label: 'Contact',
    query: 'How can I contact him?',
  },
];

export const GUARDRAILS: GuardrailRule[] = [
  {
    id: 'private-contact',
    triggers: [
      'phone',
      'mobile',
      'whatsapp',
      'home address',
      'personal address',
      'where exactly does he live',
      'exact location',
    ],
    response:
      'I keep personal contact information private. For professional contact, use athanasios@tasis.info, LinkedIn, GitHub, or the Book a call button on the site.',
  },
  {
    id: 'sensitive-personal',
    triggers: [
      'relationship',
      'girlfriend',
      'boyfriend',
      'family',
      'religion',
      'politics',
      'medical',
      'health',
      'birthday',
      'age',
      'kink',
      'sex',
    ],
    response:
      'I keep this assistant focused on professional information: education, work, projects, skills, research interests, career goals and contact channels.',
  },
  {
    id: 'unrelated',
    triggers: [
      'weather',
      'news',
      'stocks',
      'sports',
      'movie',
      'recipe',
      'homework unrelated',
      'politics unrelated',
    ],
    response:
      'I only answer questions about Athanasios Tasis and his professional background. Try asking about his projects, CERN work, skills, education, or career goals.',
  },
  {
    id: 'guessing',
    triggers: ['guess', 'speculate', 'rumor', 'do you think he', 'probably'],
    response:
      'I avoid guessing. I can answer from the information available in this profile, but I will not invent personal or professional details.',
  },
  {
    id: 'secrets',
    triggers: ['password', 'secret', 'token', 'api key', 'private document', 'id card', 'passport'],
    response:
      'I do not provide secrets, credentials or private documents. I can only provide public professional profile information.',
  },
];

export const FACTS = factsData as PersonalFact[];

export const KB = kbData as KBEntry[];

export const CATEGORY_LABELS: Record<FactCategory, string> = {
  identity: 'Identity',
  education: 'Education',
  experience: 'Experience',
  projects: 'Projects',
  skills: 'Skills',
  research: 'Research',
  career: 'Career',
  work_style: 'Work style',
  interview: 'Interview',
  contact: 'Contact',
  guardrail: 'Guardrail',
  website: 'Website',
  personality: 'Personality',
  availability: 'Availability',
  achievements: 'Achievements',
  technical_opinion: 'Technical opinion',
};

export const CATEGORY_ALIASES: Record<string, FactCategory[]> = {
  project: ['projects'],
  projects: ['projects'],
  portfolio: ['projects'],
  skill: ['skills'],
  skills: ['skills'],
  stack: ['skills'],
  tech: ['skills', 'technical_opinion'],
  education: ['education'],
  university: ['education'],
  degree: ['education'],
  career: ['career', 'availability'],
  job: ['career', 'interview'],
  hire: ['career', 'interview'],
  interview: ['interview'],
  research: ['research'],
  thesis: ['research', 'education'],
  contact: ['contact'],
  email: ['contact'],
  website: ['website'],
  site: ['website'],
  personality: ['work_style'],
  style: ['work_style'],
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9+#.\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (value: string) =>
  normalize(value)
    .split(' ')
    .filter((term) => term.length > 1);

const unique = <T>(items: T[]) => Array.from(new Set(items));

const phraseScore = (query: string, candidate: string) => {
  const q = normalize(query);
  const c = normalize(candidate);
  if (!q || !c) return 0;
  let score = 0;
  if (q === c) score += 120;
  if (c.includes(q)) score += 45;
  if (q.includes(c)) score += 20;
  const qTerms = tokenize(q);
  const cTerms = new Set(tokenize(c));
  for (const term of qTerms) {
    if (term.length > 2 && cTerms.has(term)) score += 8;
    else if (term.length > 3 && c.includes(term)) score += 3;
  }
  return score;
};

const scoreText = (query: string, candidates: string[]) =>
  candidates.reduce((score, candidate) => score + phraseScore(query, candidate), 0);

export const detectCategories = (question: string): FactCategory[] => {
  const normalizedQuestion = normalize(question);
  const categories: FactCategory[] = [];
  for (const [alias, mapped] of Object.entries(CATEGORY_ALIASES)) {
    if (normalizedQuestion.includes(normalize(alias))) categories.push(...mapped);
  }
  return unique(categories);
};

export const findGuardrailResponse = (question: string): string | null => {
  const normalizedQuestion = normalize(question);
  const rule = GUARDRAILS.find((item) =>
    item.triggers.some((trigger) => normalizedQuestion.includes(normalize(trigger))),
  );
  return rule?.response ?? null;
};

export const rankFacts = (question: string): RetrievalResult[] => {
  if (findGuardrailResponse(question)) return [];
  const categories = detectCategories(question);
  return FACTS.map((fact) => {
    const categoryBoost = categories.includes(fact.category) ? 18 : 0;
    const score =
      scoreText(question, [
        fact.id,
        fact.title,
        fact.text,
        fact.category,
        CATEGORY_LABELS[fact.category],
        ...fact.keywords,
      ]) +
      categoryBoost +
      (fact.priority ?? 0);
    return { fact, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
};

export const searchFacts = (question: string, limit = 6): PersonalFact[] =>
  rankFacts(question)
    .slice(0, limit)
    .map((item) => item.fact);

export const searchByCategory = (category: FactCategory, limit = 20): PersonalFact[] =>
  FACTS.filter((fact) => fact.category === category)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    .slice(0, limit);

export const getFactById = (id: string): PersonalFact | undefined =>
  FACTS.find((fact) => fact.id === id);

export const listTopics = () =>
  Object.entries(CATEGORY_LABELS).map(([id, label]) => ({
    id: id as FactCategory,
    label,
    count: FACTS.filter((fact) => fact.category === id).length,
  }));

const trimAnswer = (answer: string, maxCharacters: number) => {
  if (answer.length <= maxCharacters) return answer;
  const trimmed = answer.slice(0, maxCharacters - 3).trim();
  const lastStop = Math.max(trimmed.lastIndexOf('.'), trimmed.lastIndexOf(';'));
  return `${trimmed.slice(0, lastStop > 250 ? lastStop + 1 : trimmed.length).trim()}...`;
};

export const answerFromFacts = (question: string, options: AnswerOptions = {}): string => {
  const guardrail = findGuardrailResponse(question);
  if (guardrail) return guardrail;

  const maxFacts = options.maxFacts ?? 5;
  const maxCharacters = options.maxCharacters ?? 1100;
  const facts = searchFacts(question, maxFacts);
  if (facts.length === 0) return FALLBACK;

  const answer = facts
    .map((fact) => (options.includeTitles ? `${fact.title}: ${fact.text}` : fact.text))
    .join(' ');
  return trimAnswer(answer, maxCharacters);
};

export const answerFromKB = (question: string): string => {
  const guardrail = findGuardrailResponse(question);
  if (guardrail) return guardrail;

  const best = KB.map((entry) => ({
    entry,
    score: scoreText(question, [entry.id, entry.a, ...entry.q]),
  }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)[0];

  if (best && best.score >= 35) return best.entry.a;
  return answerFromFacts(question);
};

export const answerSmart = (question: string, options: AnswerOptions = {}): string => {
  const guardrail = findGuardrailResponse(question);
  if (guardrail) return guardrail;

  const normalizedQuestion = normalize(question);
  if (
    ['help', 'what can i ask', 'capabilities'].some((phrase) => normalizedQuestion.includes(phrase))
  ) {
    return `${FALLBACK} Suggested questions: ${SUGGESTIONS.join(' | ')}`;
  }

  return answerFromFacts(question, options);
};

export const getRelatedQuestions = (question: string, limit = 5): SuggestedPrompt[] => {
  const facts = searchFacts(question, 5);
  const terms = new Set(facts.flatMap((fact) => fact.keywords.map(normalize)));
  const ranked = SUGGESTED_PROMPTS.map((prompt) => ({
    prompt,
    score: Array.from(terms).reduce(
      (score, term) => score + (normalize(prompt.query).includes(term) ? 1 : 0),
      0,
    ),
  })).sort((a, b) => b.score - a.score);
  return ranked.slice(0, limit).map((item) => item.prompt);
};
