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

export const BOT_NAME = 'Profile assistant';

export const BOT_INTRO =
  'Ask about Athanasios Tasis: work, projects, education, technical background, or contact details.';

export const FALLBACK =
  'I can answer profile questions about Athanasios Tasis: education, CERN/ALICE work, projects, skills, research interests, role fit and professional contact details. I do not answer unrelated questions or share private personal information.';

export const SUGGESTIONS = [
  'What does he do?',
  'What did he do at CERN?',
  'Which projects should I read?',
  'What is his technical stack?',
  'What roles fit him?',
  'What is his thesis about?',
  'How can I contact him?',
];

export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  { label: 'Profile', query: 'Give me a short profile of Athanasios.' },
  { label: 'CERN', query: 'What did he do at CERN ALICE?' },
  { label: 'Projects', query: 'Which projects should I read first?' },
  { label: 'Stack', query: 'What is his technical stack?' },
  { label: 'Roles', query: 'What roles fit him?' },
  { label: 'Thesis', query: 'What is his thesis about?' },
  { label: 'Contact', query: 'How can I contact him?' },
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
      'I do not share private contact details. For professional contact, use athanasios@tasis.info, LinkedIn, GitHub, or the Book a call button.',
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
      'sex',
    ],
    response:
      'I keep this assistant focused on professional information: education, work, projects, skills, research interests, role fit and contact channels.',
  },
  {
    id: 'unrelated',
    triggers: ['weather', 'news', 'stocks', 'sports', 'movie', 'recipe', 'homework unrelated'],
    response:
      'I only answer questions about Athanasios Tasis and his professional background. Try asking about his projects, CERN work, skills, education, or contact details.',
  },
  {
    id: 'guessing',
    triggers: ['guess', 'speculate', 'rumor', 'probably'],
    response:
      'I avoid guessing. I can answer from the information in this profile, but I will not invent personal or professional details.',
  },
  {
    id: 'secrets',
    triggers: ['password', 'secret', 'token', 'api key', 'private document', 'id card', 'passport'],
    response: 'I do not provide secrets, credentials or private documents.',
  },
];

export const FACTS: PersonalFact[] = [
  {
    id: 'identity-summary',
    category: 'identity',
    title: 'Profile',
    text: 'Athanasios Tasis is a final-year Computer Engineering & Informatics student at the University of Patras, focused on data systems, backend work, applied ML and distributed systems.',
    keywords: ['who is he', 'summary', 'bio', 'profile', 'about athanasios', 'what does he do'],
    priority: 10,
  },
  {
    id: 'identity-location',
    category: 'identity',
    title: 'Location',
    text: 'He is based in Europe and is open to graduate or junior roles. Exact private address details are not shared on this site.',
    keywords: ['where is he based', 'europe', 'remote', 'relocation', 'location'],
    priority: 7,
  },
  {
    id: 'education-degree',
    category: 'education',
    title: 'Education',
    text: 'He is studying for an integrated 5-year MEng/Diploma in Computer Engineering & Informatics at the University of Patras.',
    keywords: ['education', 'degree', 'university', 'patras', 'ceid', 'studies'],
    priority: 10,
  },
  {
    id: 'education-coursework',
    category: 'education',
    title: 'Coursework',
    text: 'Relevant coursework includes Distributed Systems, Information Retrieval, Machine Learning, Computer Networks, Operating Systems, Algorithms & Data Structures and Databases.',
    keywords: ['courses', 'coursework', 'distributed systems', 'machine learning', 'networks'],
    priority: 8,
  },
  {
    id: 'thesis',
    category: 'research',
    title: 'Thesis',
    text: 'His diploma thesis topic is Dynamic Scaling of Computing Resources in Edge Computing using Reinforcement Learning.',
    keywords: ['thesis', 'diploma thesis', 'edge computing', 'reinforcement learning', 'rl'],
    priority: 10,
  },
  {
    id: 'cern-summary',
    category: 'experience',
    title: 'CERN/ALICE',
    text: 'From February to May 2026 he worked as a Data Engineering Intern at GSI Helmholtz Centre on CERN ALICE Time Projection Chamber quality-control workflows.',
    keywords: ['cern', 'alice', 'gsi', 'internship', 'data engineering', 'tpc'],
    priority: 10,
  },
  {
    id: 'cern-work',
    category: 'experience',
    title: 'CERN technical work',
    text: 'The work involved ROOT/C++ and Python-oriented data-processing pipelines for detector datasets, automated quality-control plots, file validation and HPC batch workflows.',
    keywords: ['root', 'c++', 'python', 'qc plots', 'detector data', 'hpc', 'pipeline'],
    priority: 10,
  },
  {
    id: 'teaching',
    category: 'experience',
    title: 'Teaching',
    text: 'He worked as a teaching or technical assistant for Analog & Digital Signals and SQL/database lab work at the University of Patras.',
    keywords: ['teaching assistant', 'signals', 'sql', 'database lab', 'mentoring'],
    priority: 7,
  },
  {
    id: 'projects-dht',
    category: 'projects',
    title: 'Distributed systems project',
    text: 'The Distributed Systems project implements Chord and Pastry-style distributed hash-table behavior, including routing, data placement, parallel ingestion and node-failure simulation.',
    keywords: ['dht', 'distributed hash table', 'chord', 'pastry', 'distributed systems'],
    priority: 10,
  },
  {
    id: 'projects-tfidf',
    category: 'projects',
    title: 'TF-IDF search engine',
    text: 'The TF-IDF Search Engine project includes indexing, preprocessing, stemming, cosine ranking, multiple weighting schemes, clustering and retrieval evaluation.',
    keywords: ['tfidf', 'tf-idf', 'search engine', 'information retrieval', 'clustering'],
    priority: 10,
  },
  {
    id: 'projects-wsn',
    category: 'projects',
    title: 'Sensor forecasting',
    text: 'The Temp Hum Prediction Model project forecasts temperature, humidity and light from wireless-sensor-network data using time-series and ML workflows.',
    keywords: ['temperature', 'humidity', 'forecasting', 'wsn', 'sensor', 'time series'],
    priority: 9,
  },
  {
    id: 'projects-web',
    category: 'projects',
    title: 'Web systems',
    text: 'The Thesis Management Website is a PHP/MySQL academic workflow system with role-based access, audit logging and JSON/XML REST endpoints.',
    keywords: ['web', 'php', 'mysql', 'thesis management', 'rest', 'rbac'],
    priority: 7,
  },
  {
    id: 'projects-read-first',
    category: 'projects',
    title: 'Read first',
    text: 'Good first projects to read are Distributed Systems, TFIDF-Search-Engine and Temp Hum Prediction Model. Together they show systems work, information retrieval and applied data modeling.',
    keywords: ['best projects', 'top projects', 'which projects', 'read first'],
    priority: 10,
  },
  {
    id: 'skills-languages',
    category: 'skills',
    title: 'Languages',
    text: 'He works mostly with Python and C/C++, with additional experience in SQL, PHP, JavaScript/TypeScript and shell scripting.',
    keywords: ['languages', 'python', 'c++', 'c', 'sql', 'php', 'javascript', 'typescript'],
    priority: 10,
  },
  {
    id: 'skills-data',
    category: 'skills',
    title: 'Data tooling',
    text: 'His data tooling includes pandas, NumPy, scikit-learn, Matplotlib, seaborn, SARIMAX-style forecasting workflows, SQL and ROOT for scientific data.',
    keywords: ['data stack', 'pandas', 'numpy', 'scikit-learn', 'root', 'matplotlib', 'sql'],
    priority: 9,
  },
  {
    id: 'skills-systems',
    category: 'skills',
    title: 'Systems',
    text: 'His systems background includes Linux, HPC batch workflows, distributed-system simulations, networking coursework, databases and backend-oriented project work.',
    keywords: ['systems', 'linux', 'hpc', 'networking', 'databases', 'backend'],
    priority: 9,
  },
  {
    id: 'career-roles',
    category: 'career',
    title: 'Roles',
    text: 'He is looking for graduate or junior roles around backend engineering, data engineering, ML engineering, research software, scientific computing or data platforms.',
    keywords: ['roles', 'jobs', 'career', 'open to work', 'looking for', 'fit'],
    priority: 10,
  },
  {
    id: 'career-fit',
    category: 'career',
    title: 'Fit',
    text: 'He is a better fit for data-heavy and systems-heavy engineering than for pure frontend or generic marketing-site work.',
    keywords: ['fit', 'backend or frontend', 'frontend', 'backend', 'data engineer'],
    priority: 8,
  },
  {
    id: 'work-style',
    category: 'work_style',
    title: 'Work style',
    text: 'He tends to start by understanding the system, reproducing the issue, checking data or logs, isolating variables and then making the smallest reliable change.',
    keywords: ['work style', 'problem solving', 'debugging', 'how does he solve problems'],
    priority: 9,
  },
  {
    id: 'achievements',
    category: 'achievements',
    title: 'Recognition',
    text: 'He received the Eurobank Ergasias Scholarship, awarded to the top-ranked first-year student in his department, and placed 12th with a team in the Hellenic University Hackathon.',
    keywords: ['awards', 'scholarship', 'eurobank', 'hackathon', 'recognition'],
    priority: 8,
  },
  {
    id: 'contact',
    category: 'contact',
    title: 'Contact',
    text: 'Professional contact channels are athanasios@tasis.info, LinkedIn at linkedin.com/in/thanostasis, GitHub at github.com/thonos-cpu and the Book a call button on this site.',
    keywords: ['contact', 'email', 'linkedin', 'github', 'book a call', 'reach him'],
    priority: 10,
  },
  {
    id: 'site',
    category: 'website',
    title: 'Website',
    text: 'This site is built with Astro and TypeScript, deployed as static pages, and uses GitHub repository data at build time.',
    keywords: ['website', 'site', 'astro', 'typescript', 'github pages', 'stack'],
    priority: 6,
  },
];

export const KB: KBEntry[] = FACTS.map((fact) => ({
  id: fact.id,
  q: fact.keywords,
  a: fact.text,
}));

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
  tech: ['skills'],
  education: ['education'],
  university: ['education'],
  degree: ['education'],
  career: ['career'],
  job: ['career'],
  role: ['career'],
  roles: ['career'],
  hire: ['career'],
  research: ['research'],
  thesis: ['research', 'education'],
  contact: ['contact'],
  email: ['contact'],
  website: ['website'],
  site: ['website'],
  style: ['work_style'],
  problem: ['work_style'],
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

  const maxFacts = options.maxFacts ?? 4;
  const maxCharacters = options.maxCharacters ?? 800;
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
