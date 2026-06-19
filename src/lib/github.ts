import "server-only";

import { profileFallback, repositoriesFallback } from "@/lib/portfolio-data";
import type { GitHubProfile, Repository } from "@/lib/types";

const API = "https://api.github.com";
const USER = "thonos-cpu";

function headers(): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "tasis-portfolio",
    ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
  };
}

async function githubFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    headers: headers(),
    next: { revalidate: 3600, tags: ["github"] },
  });
  if (!response.ok) throw new Error(`GitHub request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export async function getGitHubData(): Promise<{ profile: GitHubProfile; repositories: Repository[] }> {
  try {
    const [user, repos] = await Promise.all([
      githubFetch<Record<string, unknown>>(`/users/${USER}`),
      githubFetch<Record<string, unknown>[]>(`/users/${USER}/repos?type=public&sort=updated&per_page=100`),
    ]);

    return {
      profile: {
        login: String(user.login),
        name: String(user.name || profileFallback.name),
        avatarUrl: String(user.avatar_url || profileFallback.avatarUrl),
        bio: typeof user.bio === "string" ? user.bio : null,
        location: typeof user.location === "string" ? user.location : null,
        publicRepos: Number(user.public_repos || 0),
        followers: Number(user.followers || 0),
        htmlUrl: String(user.html_url || profileFallback.htmlUrl),
      },
      repositories: repos
        .filter((repo) => !repo.private)
        .map((repo) => ({
          id: Number(repo.id),
          name: String(repo.name),
          description: typeof repo.description === "string" ? repo.description : null,
          language: typeof repo.language === "string" ? repo.language : null,
          stars: Number(repo.stargazers_count || 0),
          forks: Number(repo.forks_count || 0),
          updatedAt: String(repo.pushed_at || repo.updated_at),
          cloneUrl: String(repo.clone_url),
          htmlUrl: String(repo.html_url),
          topics: Array.isArray(repo.topics) ? repo.topics.map(String) : [],
          archived: Boolean(repo.archived),
        })),
    };
  } catch (error) {
    console.warn(JSON.stringify({ level: "warn", message: "github_fallback", error: error instanceof Error ? error.message : String(error) }));
    return {
      profile: profileFallback,
      repositories: repositoriesFallback.map((repository) => ({ ...repository, topics: [...repository.topics] })),
    };
  }
}
