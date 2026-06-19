export type GitHubProfile = {
  login: string;
  name: string;
  avatarUrl: string;
  bio: string | null;
  location: string | null;
  publicRepos: number;
  followers: number;
  htmlUrl: string;
};

export type Repository = {
  id: number;
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  updatedAt: string;
  cloneUrl: string;
  htmlUrl: string;
  topics: string[];
  archived: boolean;
};
