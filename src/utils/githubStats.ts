import githubStats from "@/data/github-stats.json";

export type GitHubStats = typeof githubStats;

export function formatGitHubCount(value: number): string {
  if (value >= 1000) {
    const rounded = value / 1000;
    return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}k`;
  }

  return String(value);
}

export function formatGitHubDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function getRepoStars(repo: keyof GitHubStats["repositories"]): string {
  return formatGitHubCount(githubStats.repositories[repo].stars);
}

export default githubStats;
