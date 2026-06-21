/**
 * Curated CV content (hand-authored from the source CV).
 *
 * Privacy: phone number and personal/home location are intentionally omitted.
 * Employer/institution countries are kept as professional context only.
 * The CV PDF is never shipped or linked — there is no download path by design.
 */

export const person = {
  name: 'Athanasios Tasis',
  role: 'Computer Engineering Student',
  // A single line that earns the scroll.
  headline: 'A final-year Computer Engineering student who likes building things with data.',
  // Longer positioning statement, used in the hero / meta description.
  summary:
    'Final-year Computer Engineering student building data and ML projects in Python and C/C++, including an internship on CERN’s ALICE experiment.',
  // Contact — email is public (also the domain of this site). No phone, no address.
  email: 'athanasios@tasis.info',
  links: {
    github: 'https://github.com/thonos-cpu',
    linkedin: 'https://www.linkedin.com/in/thanostasis',
    site: 'https://tasis.info',
    cal: 'https://app.cal.eu/athanasiostasis/book',
  },
  // Neutral region only — never a precise location.
  availability: 'Europe · open to graduate & junior roles',
} as const;

export interface ExperienceItem {
  role: string;
  org: string;
  context?: string;
  country?: string;
  start: string;
  end: string;
  current?: boolean;
  summary: string;
  highlights: string[];
  tags: string[];
}

export const experience: ExperienceItem[] = [
  {
    role: 'Data Engineering Intern — ALICE Experiment',
    org: 'GSI Helmholtz Centre for Heavy Ion Research',
    context: 'CERN ALICE · Time Projection Chamber',
    country: 'Germany',
    start: '2026-02',
    end: '2026-05',
    summary:
      'Built automated data-processing pipelines for the ALICE detector at CERN, running on a production HPC batch cluster.',
    highlights: [
      'Developed automated ROOT/C++ pipelines that generate quality-control plots from large-scale detector datasets, persisting results into the ALICE TPC data pipeline on an HPC cluster.',
      "Integrated into the real-time QC automation chain for the Time Projection Chamber on CERN's Large Hadron Collider, contributing to parallel-computing workflows on a production batch cluster.",
    ],
    tags: ['ROOT / C++', 'HPC', 'Parallel computing', 'Data pipelines'],
  },
  {
    role: 'Laboratory Teaching Assistant — Analog & Digital Signals',
    org: 'University of Patras',
    start: '2024-10',
    end: '2026-01',
    summary: 'Supported the Analog & Digital Signals laboratory course (6 hrs/week).',
    highlights: [
      'Graded lab reports, guided hands-on experiments and facilitated student–instructor communication.',
    ],
    tags: ['Teaching', 'Signals'],
  },
  {
    role: 'SQL Lab Technical Assistant',
    org: 'University of Patras',
    start: '2024-10',
    end: '2026-01',
    summary: 'Technical support for the Database Systems course (3 hrs/week).',
    highlights: [
      'Resolved technical issues and provided query-optimisation guidance to students in the Database Systems course.',
    ],
    tags: ['SQL', 'Databases', 'Mentoring'],
  },
];

export interface EducationItem {
  degree: string;
  org: string;
  start: string;
  end: string;
  note?: string;
  coursework: string[];
}

export const education: EducationItem[] = [
  {
    degree: 'MEng, Computer Engineering & Informatics',
    org: 'University of Patras',
    start: '2021',
    end: '2027-02',
    note: 'Integrated 5-year MEng (Diploma). Currently in the 5th year.',
    coursework: [
      'Distributed Systems',
      'Information Retrieval',
      'Machine Learning',
      'Computer Networks',
      'Operating Systems',
      'Algorithms & Data Structures',
    ],
  },
];

export interface Achievement {
  title: string;
  detail: string;
  year?: string;
}

export const achievements: Achievement[] = [
  {
    title: 'Eurobank Ergasias Scholarship',
    detail: 'Awarded to the #1-ranked first-year student across the department.',
  },
  {
    title: 'Hellenic University Hackathon',
    detail: '12th place — 5-person team, 5-hour competition.',
  },
];
