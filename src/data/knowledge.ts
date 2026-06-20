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
  | 'website';

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
  'How can I contact him?',
];

export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  { label: 'Profile', query: 'Give me a short profile of Athanasios.' },
  { label: 'CERN', query: 'What exactly did he do at CERN ALICE?' },
  { label: 'Projects', query: 'What are his best technical projects?' },
  { label: 'Data Engineering', query: 'Why is he a good fit for data engineering?' },
  { label: 'AI/ML', query: 'What AI and machine-learning experience does he have?' },
  { label: 'Systems', query: 'What distributed-systems experience does he have?' },
  { label: 'Interview', query: 'Why should we hire him?' },
  { label: 'Contact', query: 'How can I contact him?' },
];

export const GUARDRAILS: GuardrailRule[] = [
  {
    id: 'private-contact',
    triggers: ['phone', 'mobile', 'whatsapp', 'home address', 'personal address', 'where exactly does he live'],
    response:
      'I keep personal contact information private. For professional contact, use athanasios@tasis.info, LinkedIn, GitHub, or the Book a call button on the site.',
  },
  {
    id: 'sensitive-personal',
    triggers: ['relationship', 'girlfriend', 'family', 'religion', 'politics', 'medical', 'health', 'birthday', 'age'],
    response:
      'I keep this assistant focused on professional information: education, work, projects, skills, research interests, career goals and contact channels.',
  },
  {
    id: 'unrelated',
    triggers: ['weather', 'news', 'stocks', 'sports', 'movie', 'recipe', 'homework unrelated', 'politics unrelated'],
    response:
      'I only answer questions about Athanasios Tasis and his professional background. Try asking about his projects, CERN work, skills, education, or career goals.',
  },
  {
    id: 'unknown',
    triggers: ['guess', 'speculate', 'assume', 'rumor'],
    response:
      'I avoid guessing. I can answer from the information available in this profile, but I will not invent personal or professional details.',
  },
];

export const FACTS: PersonalFact[] = [
  {
    id: 'identity-summary',
    category: 'identity',
    title: 'Short profile',
    text:
      'Athanasios Tasis is a Computer Engineering & Informatics student at the University of Patras, focused on scalable data systems, AI/ML, distributed systems and scientific computing.',
    keywords: ['who is he', 'summary', 'bio', 'overview', 'profile', 'about'],
    priority: 10,
  },
  {
    id: 'identity-engineering-focus',
    category: 'identity',
    title: 'Engineering focus',
    text:
      'He is strongest where software engineering, data engineering and systems thinking meet: building pipelines, processing large datasets, validating outputs and making systems reliable under real constraints.',
    keywords: ['engineering focus', 'what does he do', 'software', 'data systems', 'systems thinking'],
    priority: 9,
  },
  {
    id: 'education-degree',
    category: 'education',
    title: 'Degree',
    text:
      'He studies Computer Engineering & Informatics at the University of Patras in Greece, an integrated five-year engineering diploma/MEng-style program.',
    keywords: ['education', 'degree', 'university', 'patras', 'ceid', 'studies'],
    priority: 10,
  },
  {
    id: 'education-coursework',
    category: 'education',
    title: 'Relevant coursework',
    text:
      'Relevant coursework includes Distributed Systems, Information Retrieval, Machine Learning, Computer Networks, Operating Systems, Algorithms and Data Structures, Databases and software engineering subjects.',
    keywords: ['coursework', 'courses', 'classes', 'subjects', 'academic'],
    priority: 7,
  },
  {
    id: 'education-final-year',
    category: 'education',
    title: 'Academic stage',
    text:
      'He is in the final stage of his integrated engineering studies and is building professional experience through internships, research-oriented projects and applied engineering work.',
    keywords: ['final year', 'student status', 'graduation', 'academic stage'],
    priority: 7,
  },
  {
    id: 'experience-cern-main',
    category: 'experience',
    title: 'CERN ALICE internship',
    text:
      'He worked as a Data Engineering Intern on CERN ALICE, hosted at GSI Helmholtz Centre for Heavy-Ion Research, from February to May 2026. His work focused on automated detector-data quality-control pipelines for the ALICE Time Projection Chamber.',
    keywords: ['cern', 'alice', 'gsi', 'internship', 'data engineering', 'tpc', 'time projection chamber'],
    priority: 10,
  },
  {
    id: 'experience-cern-technical',
    category: 'experience',
    title: 'CERN technical work',
    text:
      'At CERN ALICE, he worked with ROOT, C++/Python-style data workflows, Linux and HPC batch infrastructure to transform detector outputs into automated monitoring and quality-control plots.',
    keywords: ['root', 'c++', 'python', 'hpc', 'batch', 'quality control', 'qc', 'plots'],
    priority: 10,
  },
  {
    id: 'experience-cern-impact',
    category: 'experience',
    title: 'CERN impact',
    text:
      'The value of his CERN work was reducing manual inspection effort and making detector-data validation more reproducible, scalable and suitable for production scientific-computing workflows.',
    keywords: ['impact', 'result', 'production', 'scientific computing', 'manual inspection', 'automation'],
    priority: 8,
  },
  {
    id: 'experience-teaching-signals',
    category: 'experience',
    title: 'Teaching assistant experience',
    text:
      'At the University of Patras, he supported students as a Laboratory Teaching Assistant for Analog & Digital Signals and as a Technical Assistant for the Database Systems SQL lab.',
    keywords: ['teaching', 'teaching assistant', 'ta', 'signals', 'sql lab', 'database systems'],
    priority: 8,
  },
  {
    id: 'experience-teaching-value',
    category: 'experience',
    title: 'Teaching value',
    text:
      'His teaching-assistant work strengthened his ability to explain technical concepts, debug student work, support lab exercises and communicate clearly with people at different experience levels.',
    keywords: ['mentor', 'teaching value', 'communication', 'students', 'lab reports'],
    priority: 6,
  },
  {
    id: 'skills-programming',
    category: 'skills',
    title: 'Programming languages',
    text:
      'His main programming languages are Python and C/C++. He also has experience with Java, PHP, SQL, JavaScript and Prolog.',
    keywords: ['programming', 'languages', 'python', 'c++', 'cpp', 'java', 'php', 'sql', 'javascript', 'prolog'],
    priority: 10,
  },
  {
    id: 'skills-data-ml',
    category: 'skills',
    title: 'Data and ML stack',
    text:
      'His data and machine-learning stack includes Pandas, NumPy, scikit-learn, PyTorch, TensorFlow, statsmodels, SARIMAX-style forecasting workflows and data visualization tooling.',
    keywords: ['machine learning', 'ml', 'ai', 'pandas', 'numpy', 'sklearn', 'pytorch', 'tensorflow', 'statsmodels'],
    priority: 10,
  },
  {
    id: 'skills-root-hpc',
    category: 'skills',
    title: 'Scientific computing stack',
    text:
      'For scientific computing, he has worked with ROOT, C/C++, Linux environments, batch execution and HPC-style workflows used for large experimental datasets.',
    keywords: ['root', 'scientific computing', 'hpc', 'linux', 'batch', 'experimental data'],
    priority: 9,
  },
  {
    id: 'skills-systems',
    category: 'skills',
    title: 'Systems skills',
    text:
      'He has hands-on experience with distributed systems, parallel computing, concurrency, Linux, networking and performance-aware software design.',
    keywords: ['systems', 'distributed systems', 'parallel', 'concurrency', 'linux', 'performance'],
    priority: 9,
  },
  {
    id: 'skills-networking',
    category: 'skills',
    title: 'Networking skills',
    text:
      'His networking knowledge includes TCP/IP, OSPF, BGP, MPLS, VLANs, firewall configuration and hands-on tooling such as GNS3, Cisco IOS and MikroTik RouterOS.',
    keywords: ['networking', 'tcp/ip', 'ospf', 'bgp', 'mpls', 'vlan', 'cisco', 'mikrotik', 'gns3'],
    priority: 8,
  },
  {
    id: 'projects-overview',
    category: 'projects',
    title: 'Project overview',
    text:
      'His strongest projects include a Chord/Pastry distributed hash-table engine, a wireless-sensor time-series forecasting pipeline, a TF-IDF information-retrieval engine, hotel-booking analytics and a thesis-management web platform.',
    keywords: ['projects', 'portfolio', 'best projects', 'github', 'work samples'],
    priority: 10,
  },
  {
    id: 'project-dht-purpose',
    category: 'projects',
    title: 'Distributed hash table project',
    text:
      'He built a distributed hash-table engine implementing Chord and Pastry concepts, with simulated nodes, distributed routing and validation under node churn and failure conditions.',
    keywords: ['dht', 'distributed hash table', 'chord', 'pastry', 'p2p', 'node failure', 'churn'],
    priority: 10,
  },
  {
    id: 'project-dht-scale',
    category: 'projects',
    title: 'DHT scale',
    text:
      'The DHT project handled large record ingestion, hundreds of simulated nodes and O(log N)-style routing behavior, making it a strong systems and distributed-algorithms project.',
    keywords: ['dht scale', 'routing', 'records', 'simulated nodes', 'o(log n)'],
    priority: 8,
  },
  {
    id: 'project-forecasting-purpose',
    category: 'projects',
    title: 'IoT forecasting project',
    text:
      'His Temp/Hum Prediction Model is an end-to-end pipeline over wireless-sensor-network measurements, predicting temperature, humidity and light from environmental signals using time-series and ML methods.',
    keywords: ['temperature', 'humidity', 'iot', 'wireless sensor', 'wsn', 'forecasting', 'time series'],
    priority: 10,
  },
  {
    id: 'project-forecasting-methods',
    category: 'projects',
    title: 'Forecasting methods',
    text:
      'The forecasting project involved cleaning time-indexed sensor data, engineering lag and time features, evaluating rolling folds and comparing statistical forecasting with machine-learning baselines.',
    keywords: ['sarimax', 'cross validation', 'rolling folds', 'feature engineering', 'lag features'],
    priority: 9,
  },
  {
    id: 'project-tfidf-purpose',
    category: 'projects',
    title: 'TF-IDF search engine',
    text:
      'He built a TF-IDF search engine over a medical corpus with an inverted index, stemming, cosine similarity ranking, evaluation metrics and clustering experiments.',
    keywords: ['tf-idf', 'tfidf', 'search engine', 'information retrieval', 'inverted index', 'cosine', 'medical corpus'],
    priority: 10,
  },
  {
    id: 'project-tfidf-depth',
    category: 'projects',
    title: 'TF-IDF depth',
    text:
      'The information-retrieval project included multiple TF-IDF schemes, grid-search tuning, ranking evaluation and clustering with classical vector-space methods and sentence-transformer embeddings.',
    keywords: ['map', 'grid search', 'clustering', 'sentence transformers', 'ranking evaluation'],
    priority: 8,
  },
  {
    id: 'project-hotel',
    category: 'projects',
    title: 'Hotel analytics project',
    text:
      'His hotel-booking analytics project analyzed more than 119,000 bookings to study cancellation behavior, seasonal demand patterns and revenue-related signals using Python data-analysis tooling.',
    keywords: ['hotel', 'booking', 'eda', 'data analysis', 'cancellation', 'revenue', 'seasonal'],
    priority: 7,
  },
  {
    id: 'project-thesis-platform',
    category: 'projects',
    title: 'Thesis-management platform',
    text:
      'He built a thesis-management web platform with role-based access control, database-backed workflows, audit-log triggers and public JSON/XML REST endpoints using PHP and MySQL.',
    keywords: ['thesis platform', 'php', 'mysql', 'web app', 'rest api', 'role based access'],
    priority: 7,
  },
  {
    id: 'project-spatial',
    category: 'projects',
    title: 'Spatial indexing',
    text:
      'He has also built spatial data structures such as quadtrees and R-trees in Python for efficient spatial indexing and query behavior.',
    keywords: ['quadtree', 'r-tree', 'rtree', 'spatial index', 'spatial query'],
    priority: 6,
  },
  {
    id: 'project-sorting',
    category: 'projects',
    title: 'Algorithms benchmarking',
    text:
      'He built C++ algorithm projects involving sorting and search methods such as quicksort, mergesort, binary search and interpolation search, with benchmarking-style comparison.',
    keywords: ['sorting', 'algorithms', 'c++', 'quicksort', 'mergesort', 'binary search'],
    priority: 6,
  },
  {
    id: 'research-thesis-topic',
    category: 'research',
    title: 'Diploma thesis',
    text:
      'His diploma thesis topic is Dynamic Scaling of Computing Resources in Edge Computing using Reinforcement Learning, combining systems, resource management and AI-based decision making.',
    keywords: ['thesis', 'diploma thesis', 'reinforcement learning', 'edge computing', 'dynamic scaling'],
    priority: 10,
  },
  {
    id: 'research-interests',
    category: 'research',
    title: 'Research interests',
    text:
      'His research interests include distributed systems, reinforcement learning, edge computing, AI infrastructure, time-series forecasting, information retrieval and scientific data processing.',
    keywords: ['research', 'interests', 'reinforcement learning', 'edge computing', 'ai infrastructure', 'information retrieval'],
    priority: 9,
  },
  {
    id: 'career-targets',
    category: 'career',
    title: 'Target roles',
    text:
      'He is interested in data engineering, backend engineering, distributed systems, AI/ML engineering, MLOps, AIOps and scientific-computing roles.',
    keywords: ['roles', 'jobs', 'looking for', 'career', 'data engineering', 'backend', 'mlops', 'aiops'],
    priority: 10,
  },
  {
    id: 'career-environment',
    category: 'career',
    title: 'Preferred environment',
    text:
      'He is most interested in teams working on technically difficult problems with real data, production constraints and measurable impact rather than purely superficial software work.',
    keywords: ['ideal company', 'preferred team', 'work environment', 'culture', 'technical problems'],
    priority: 8,
  },
  {
    id: 'career-long-term',
    category: 'career',
    title: 'Long-term goal',
    text:
      'Long term, he wants to work on large-scale data platforms, distributed systems and AI infrastructure where software engineering and machine learning intersect.',
    keywords: ['future goals', 'career goals', 'long term', 'future plans'],
    priority: 8,
  },
  {
    id: 'career-availability',
    category: 'career',
    title: 'Availability',
    text:
      'He is open to internships, traineeships and early-career engineering roles, especially in data, AI/ML, backend, systems and scientific-computing contexts.',
    keywords: ['available', 'availability', 'start date', 'open to work', 'hiring'],
    priority: 7,
  },
  {
    id: 'work-style-general',
    category: 'work_style',
    title: 'Work style',
    text:
      'He prefers understanding the whole system before changing it. He likes clear requirements, measurable outputs, debugging with evidence and building solutions that are correct before they are made more complex.',
    keywords: ['work style', 'how does he work', 'engineering approach', 'debugging'],
    priority: 9,
  },
  {
    id: 'work-style-learning',
    category: 'work_style',
    title: 'Learning style',
    text:
      'He learns best by building, breaking and improving real systems. He prefers practical projects, local experimentation and understanding why something works rather than memorizing surface-level commands.',
    keywords: ['learning style', 'how does he learn', 'study style', 'learn'],
    priority: 8,
  },
  {
    id: 'work-style-strengths',
    category: 'work_style',
    title: 'Strengths',
    text:
      'His main strengths are persistence, technical curiosity, systems thinking, quick learning and the ability to connect low-level engineering with higher-level data and ML workflows.',
    keywords: ['strengths', 'strong points', 'best qualities', 'advantages'],
    priority: 9,
  },
  {
    id: 'work-style-weaknesses',
    category: 'work_style',
    title: 'Weaknesses',
    text:
      'A realistic weakness is that he can sometimes go very deep into technical details. He manages this by defining deliverables, measuring progress and separating exploration from production work.',
    keywords: ['weakness', 'weaknesses', 'improve', 'development areas'],
    priority: 7,
  },
  {
    id: 'work-style-teamwork',
    category: 'work_style',
    title: 'Teamwork',
    text:
      'In teams, he tends to take ownership of technical problems, clarify assumptions, explain his reasoning and use data or tests to resolve disagreements.',
    keywords: ['teamwork', 'team', 'collaboration', 'communication', 'conflict'],
    priority: 8,
  },
  {
    id: 'interview-why-hire',
    category: 'interview',
    title: 'Why hire him',
    text:
      'He is a strong fit for teams that need someone who can build technical systems end-to-end: from data ingestion and processing to validation, automation, performance and practical deployment constraints.',
    keywords: ['why hire him', 'why should we hire', 'good fit', 'stand out', 'value'],
    priority: 10,
  },
  {
    id: 'interview-proudest-achievement',
    category: 'interview',
    title: 'Proudest achievement',
    text:
      'One of his proudest achievements is contributing to CERN ALICE data-processing automation, because it involved production scientific computing, large-scale detector data and real operational value.',
    keywords: ['proudest', 'achievement', 'biggest achievement', 'accomplishment'],
    priority: 8,
  },
  {
    id: 'interview-hardest-project',
    category: 'interview',
    title: 'Hardest project',
    text:
      'His hardest projects are the CERN ALICE pipelines and the distributed hash-table engine, because both required correctness under complex conditions: large-scale data, infrastructure constraints, node behavior, failures and validation.',
    keywords: ['hardest project', 'most difficult', 'challenging project', 'complex project'],
    priority: 8,
  },
  {
    id: 'interview-conflict',
    category: 'interview',
    title: 'Handling disagreement',
    text:
      'He handles technical disagreement by making assumptions explicit, comparing evidence, testing alternatives and focusing on the solution that best satisfies the requirements.',
    keywords: ['conflict', 'disagreement', 'team conflict', 'argue', 'team issue'],
    priority: 7,
  },
  {
    id: 'interview-leadership',
    category: 'interview',
    title: 'Leadership',
    text:
      'He is early in his career but has taken leadership in academic and technical projects by owning architecture decisions, coordinating implementation work and helping teammates move through blockers.',
    keywords: ['leadership', 'lead', 'leader', 'managed team'],
    priority: 7,
  },
  {
    id: 'interview-failure',
    category: 'interview',
    title: 'Lessons learned',
    text:
      'A major lesson from his projects is that assumptions fail often. He learned to validate early, log clearly, test with real inputs and avoid trusting a pipeline until its outputs are checked.',
    keywords: ['failure', 'mistake', 'lesson learned', 'what did he learn'],
    priority: 7,
  },
  {
    id: 'interview-motivation',
    category: 'interview',
    title: 'Motivation',
    text:
      'He is motivated by difficult technical systems, real datasets, visible impact and the feeling of turning messy or complex input into reliable, useful output.',
    keywords: ['motivation', 'what motivates him', 'why engineering', 'why data'],
    priority: 8,
  },
  {
    id: 'contact-email',
    category: 'contact',
    title: 'Email',
    text:
      'The best professional email for him is athanasios@tasis.info.',
    keywords: ['email', 'mail', 'contact', 'reach'],
    priority: 10,
  },
  {
    id: 'contact-github',
    category: 'contact',
    title: 'GitHub',
    text:
      'His GitHub profile is github.com/thonos-cpu, where his technical projects and repositories are available.',
    keywords: ['github', 'code', 'repositories', 'repos', 'source'],
    priority: 10,
  },
  {
    id: 'contact-linkedin',
    category: 'contact',
    title: 'LinkedIn',
    text:
      'His LinkedIn profile is linkedin.com/in/thanostasis.',
    keywords: ['linkedin', 'professional profile', 'social'],
    priority: 9,
  },
  {
    id: 'contact-book-call',
    category: 'contact',
    title: 'Book a call',
    text:
      'For a meeting, visitors can use the Book a call button on the site to schedule directly.',
    keywords: ['book', 'call', 'meeting', 'schedule', 'interview'],
    priority: 8,
  },
  {
    id: 'website-stack',
    category: 'website',
    title: 'Website stack',
    text:
      'The site is built with Astro and TypeScript, deployed on GitHub Pages, and pulls GitHub repository data at build time for speed and freshness.',
    keywords: ['website', 'site', 'astro', 'typescript', 'github pages', 'how was this made'],
    priority: 8,
  },
  {
    id: 'website-assistant',
    category: 'website',
    title: 'Assistant design',
    text:
      'This assistant is designed to stay grounded in an explicit knowledge base, answer only professional questions about Athanasios and refuse private or unrelated requests.',
    keywords: ['assistant', 'thanosgpt', 'how does this work', 'bot', 'local gpt'],
    priority: 9,
  },
  {
    id: 'guardrail-professional-scope',
    category: 'guardrail',
    title: 'Professional scope',
    text:
      'The assistant should stay professional and answer only about Athanasios Tasis, his work, education, projects, skills, research, career goals and public contact channels.',
    keywords: ['guardrail', 'scope', 'private', 'professional'],
    priority: 10,
  },
];

export const KB: KBEntry[] = [
  {
    id: 'summary',
    q: ['who is he', 'who is athanasios', 'what does he do', 'about him', 'tell me about yourself', 'introduce', 'summary', 'bio', 'overview'],
    a: 'Athanasios Tasis is a Computer Engineering & Informatics student at the University of Patras, focused on scalable data systems, AI/ML, distributed systems and scientific computing. He has worked on CERN ALICE detector-data pipelines, builds projects in Python and C/C++, and cares about correctness, performance and reliability.',
  },
  {
    id: 'education',
    q: ['education', 'study', 'studied', 'studies', 'university', 'degree', 'college', 'school', 'uni', 'ceid', 'patras', 'major', 'student', 'academic'],
    a: 'He studies Computer Engineering & Informatics at the University of Patras, an integrated five-year engineering diploma/MEng-style program. Relevant areas include distributed systems, machine learning, information retrieval, computer networks, operating systems, algorithms, data structures and databases.',
  },
  {
    id: 'cern',
    q: ['cern', 'alice', 'gsi', 'helmholtz', 'detector', 'physics', 'internship', 'intern', 'data engineering', 'tpc', 'time projection chamber', 'hpc job', 'root pipeline'],
    a: 'Athanasios worked as a Data Engineering Intern on CERN ALICE, hosted at GSI Helmholtz Centre for Heavy-Ion Research. He worked on automated ROOT/C++ detector-data quality-control pipelines for the ALICE Time Projection Chamber, using Linux and HPC batch infrastructure to make validation workflows more scalable and reproducible.',
  },
  {
    id: 'teaching',
    q: ['teaching', 'teaching assistant', 'ta', 'lab assistant', 'tutor', 'signals lab', 'sql lab', 'mentor', 'assistant'],
    a: 'At the University of Patras, he supported students as a Laboratory Teaching Assistant for Analog & Digital Signals and as a Technical Assistant for the Database Systems SQL lab, helping with experiments, lab work, debugging and query understanding.',
  },
  {
    id: 'experience',
    q: ['experience', 'work', 'job', 'jobs', 'career', 'employment', 'professional', 'worked', 'roles held', 'background'],
    a: 'His experience spans CERN ALICE data-engineering work on ROOT/C++ pipelines and HPC workflows, plus teaching-assistant roles in signals and database systems. His background connects data engineering, scientific computing, distributed systems and applied machine learning.',
  },
  {
    id: 'skills',
    q: ['skills', 'skill', 'tech', 'technologies', 'stack', 'tools', 'expertise', 'good at', 'know', 'proficient', 'strengths'],
    a: 'Core skills: Python, C/C++, Java, PHP, SQL, JavaScript and Prolog; data/ML with Pandas, NumPy, scikit-learn, PyTorch, TensorFlow, statsmodels and ROOT; systems work in Linux, distributed systems, parallel computing, HPC and concurrency; networking with TCP/IP, OSPF, BGP, MPLS, VLANs, GNS3, Cisco IOS and MikroTik.',
  },
  {
    id: 'projects',
    q: ['projects', 'project', 'portfolio', 'built', 'build', 'made', 'work samples', 'best work', 'repositories', 'repos', 'github projects'],
    a: 'His strongest projects include a Chord/Pastry distributed hash-table engine, a wireless-sensor time-series forecasting pipeline, a TF-IDF search engine with ranking evaluation and clustering, a hotel-booking analytics project and a thesis-management web platform.',
  },
  {
    id: 'proj-dht',
    q: ['distributed hash table', 'dht', 'chord', 'pastry', 'distributed project', 'node failure', 'churn', 'peer to peer', 'p2p'],
    a: 'Distributed Systems project: a from-scratch DHT engine implementing Chord and Pastry-style behavior with simulated nodes, distributed routing and validation under churn and node failure. It demonstrates systems thinking, routing logic and correctness under unstable distributed conditions.',
  },
  {
    id: 'proj-temphum',
    q: ['temperature', 'humidity', 'sensor', 'iot', 'wireless sensor', 'wsn', 'sarimax', 'time series project', 'forecasting project', 'prediction model'],
    a: 'Temp/Hum Prediction Model: an end-to-end forecasting pipeline over wireless-sensor-network data. It includes cleaning time-indexed sensor measurements, feature engineering, lag features, rolling validation and statistical/ML forecasting for temperature, humidity and light.',
  },
  {
    id: 'proj-tfidf',
    q: ['tfidf', 'tf-idf', 'search engine', 'information retrieval', 'ir', 'inverted index', 'clustering', 'embeddings', 'cosine'],
    a: 'TF-IDF Search Engine: a vector-space information-retrieval system over a medical corpus with inverted indexing, stemming, cosine ranking, multiple TF-IDF schemes, evaluation metrics, grid-search tuning and clustering experiments with TF-IDF and sentence-transformer embeddings.',
  },
  {
    id: 'proj-hotel',
    q: ['hotel', 'booking', 'bookings', 'eda', 'data analysis', 'visualization', 'cancellation', 'revenue analysis'],
    a: 'Hotel Booking Analytics: an exploratory data-analysis project over more than 119,000 bookings, focused on cancellation behavior, seasonal demand and revenue-related patterns using Python data-analysis tooling.',
  },
  {
    id: 'proj-thesis-platform',
    q: ['thesis management', 'web platform', 'php project', 'rest api', 'web app', 'full stack', 'website project'],
    a: 'Thesis Management Platform: a web application for thesis workflows with role-based access control, MySQL-backed data, audit-log triggers and public JSON/XML REST endpoints, built with PHP and MySQL.',
  },
  {
    id: 'thesis',
    q: ['thesis', 'diploma thesis', 'research topic', 'master thesis', 'reinforcement learning', 'edge computing'],
    a: 'His diploma thesis focuses on Dynamic Scaling of Computing Resources in Edge Computing using Reinforcement Learning. The topic combines distributed systems, resource management and AI-based decision making.',
  },
  {
    id: 'career',
    q: ['looking for', 'seeking', 'open to work', 'hiring', 'available for', 'what roles', 'job search', 'opportunities', 'career goals'],
    a: 'He is interested in data engineering, backend engineering, distributed systems, AI/ML engineering, MLOps, AIOps and scientific-computing roles, especially where large-scale data and production constraints matter.',
  },
  {
    id: 'whyhire',
    q: ['why hire', 'why should', 'why should we hire him', 'stand out', 'good fit', 'value'],
    a: 'He is a strong fit for teams that need someone who can build technical systems end-to-end: data ingestion, processing, automation, validation, performance and deployment. His profile combines Python/C++, systems thinking, scientific computing and applied ML.',
  },
  {
    id: 'workstyle',
    q: ['work style', 'how does he work', 'problem solving', 'debugging', 'engineering approach'],
    a: 'He prefers understanding the whole system before changing it. He debugs with evidence, validates assumptions, measures outputs and favors simple, correct, maintainable solutions over clever but fragile ones.',
  },
  {
    id: 'strengths',
    q: ['strengths', 'strong points', 'best qualities', 'what is he good at'],
    a: 'His main strengths are persistence, technical curiosity, systems thinking, quick learning and the ability to connect low-level engineering with higher-level data and ML workflows.',
  },
  {
    id: 'weaknesses',
    q: ['weakness', 'weaknesses', 'what should he improve'],
    a: 'A realistic weakness is that he can go very deep into technical details. He manages this by defining deliverables, measuring progress and separating exploration from production work.',
  },
  {
    id: 'contact',
    q: ['contact', 'reach', 'reach out', 'get in touch', 'connect', 'talk to him', 'message', 'hire him how'],
    a: 'Best professional contact channels: email at athanasios@tasis.info, LinkedIn at linkedin.com/in/thanostasis, GitHub at github.com/thonos-cpu, or the Book a call button on the site.',
  },
  {
    id: 'private',
    q: ['phone', 'number', 'mobile', 'whatsapp', 'home address', 'personal', 'age', 'birthday', 'family', 'relationship'],
    a: 'I keep things professional and do not share private personal information. For professional contact, use athanasios@tasis.info, LinkedIn, GitHub, or the Book a call button.',
  },
  {
    id: 'site',
    q: ['this site', 'website built', 'how was this made', 'tech of site', 'astro', 'how does this work', 'this website'],
    a: 'This site is built with Astro and TypeScript, deployed on GitHub Pages. It can fetch GitHub repository data at build time and keeps this assistant grounded in a local knowledge base, without needing a third-party chatbot service.',
  },
  {
    id: 'help',
    q: ['help', 'what can i ask', 'what can you do', 'capabilities', 'questions', 'options'],
    a: 'You can ask about Athanasios’ background, CERN/ALICE work, projects, skills, tech stack, research interests, work style, career goals, interview-style questions, or how to contact him professionally.',
  },
];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9+#.\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const scoreText = (query: string, candidates: string[]) => {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return 0;
  const queryTerms = new Set(normalizedQuery.split(' ').filter(Boolean));
  let score = 0;
  for (const candidate of candidates) {
    const normalizedCandidate = normalize(candidate);
    if (!normalizedCandidate) continue;
    if (normalizedQuery === normalizedCandidate) score += 100;
    if (normalizedCandidate.includes(normalizedQuery)) score += 35;
    if (normalizedQuery.includes(normalizedCandidate)) score += 20;
    for (const term of queryTerms) {
      if (term.length > 2 && normalizedCandidate.includes(term)) score += 3;
    }
  }
  return score;
};

export const findGuardrailResponse = (question: string): string | null => {
  const normalizedQuestion = normalize(question);
  const rule = GUARDRAILS.find((item) =>
    item.triggers.some((trigger) => normalizedQuestion.includes(normalize(trigger))),
  );
  return rule?.response ?? null;
};

export const searchFacts = (question: string, limit = 5): PersonalFact[] => {
  const guardrail = findGuardrailResponse(question);
  if (guardrail) return [];

  return FACTS.map((fact) => ({
    fact,
    score:
      scoreText(question, [fact.title, fact.text, fact.category, ...fact.keywords]) +
      (fact.priority ?? 0),
  }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.fact);
};

export const answerFromFacts = (question: string): string => {
  const guardrail = findGuardrailResponse(question);
  if (guardrail) return guardrail;

  const facts = searchFacts(question, 4);
  if (facts.length === 0) return FALLBACK;

  const answer = facts.map((fact) => fact.text).join(' ');
  return answer.length > 850 ? `${answer.slice(0, 847).trim()}...` : answer;
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

  return best?.entry.a ?? answerFromFacts(question);
};
