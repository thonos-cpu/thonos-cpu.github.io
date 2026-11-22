import type { APIRoute } from 'astro';
import { FEATURED } from '../data/featured';
import { person } from '../data/profile';
import { getGitHubData } from '../lib/github';

export const GET: APIRoute = async ({ site }) => {
  const { repos } = await getGitHubData();
  const home = new URL('/', site).href;
  const projects = repos.map((repo) => {
    const title = repo.name.replace(/[_-]/g, ' ');
    const url = new URL(`/projects/${repo.slug}/`, home).href;
    const description = FEATURED[repo.name]?.tagline ?? repo.description;
    return `- [${title}](${url})${description ? `: ${description.replace(/\s+/g, ' ').trim()}` : ''}`;
  });

  const lines = [
    `# ${person.name}`,
    '',
    `> ${person.summary}`,
    '',
    '## Portfolio',
    '',
    `- [About](${home}#about)`,
    `- [Experience and education](${home}#path)`,
    `- [Technical skills](${home}#stack)`,
    '',
    '## Projects',
    '',
    ...projects,
    '',
    '## Profiles',
    '',
    `- [GitHub](${person.links.github})`,
    `- [LinkedIn](${person.links.linkedin})`,
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
