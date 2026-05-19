import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const owner = "debugtheworldbot";
const repos = ["keyStats", "ai-credit", "msync", "chromegemini"];
const outputPath = resolve("src/data/github-stats.json");
const token = process.env.GITHUB_TOKEN;

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "debugtheworldbot-me-stats-updater",
  "X-GitHub-Api-Version": "2022-11-28",
};

if (token) {
  headers.Authorization = `Bearer ${token}`;
}

async function getJson(url) {
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `GitHub API request failed: ${response.status} ${response.statusText} ${url}\n${body}`
    );
  }

  return response.json();
}

async function readExistingStats() {
  try {
    return JSON.parse(await readFile(outputPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function stripFetchTimestamp(stats) {
  if (!stats) return null;

  const { fetchedAt: _fetchedAt, ...stableStats } = stats;
  return stableStats;
}

const [profile, ...repositoryResponses] = await Promise.all([
  getJson(`https://api.github.com/users/${owner}`),
  ...repos.map(repo => getJson(`https://api.github.com/repos/${owner}/${repo}`)),
]);

const repositories = Object.fromEntries(
  repos.map((repo, index) => [
    repo,
    {
      stars: repositoryResponses[index].stargazers_count,
    },
  ])
);

const stats = {
  user: owner,
  fetchedAt: new Date().toISOString(),
  profile: {
    publicRepos: profile.public_repos,
    followers: profile.followers,
  },
  repositories,
};

const existingStats = await readExistingStats();
const existingStableStats = stripFetchTimestamp(existingStats);
const nextStableStats = stripFetchTimestamp(stats);

if (
  JSON.stringify(existingStableStats) === JSON.stringify(nextStableStats)
) {
  process.stdout.write(
    `No GitHub stats changes for ${owner}; leaving ${outputPath} unchanged.\n`
  );
  process.exit(0);
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(stats, null, 2)}\n`);

process.stdout.write(
  `Updated ${outputPath}: ${stats.profile.publicRepos} public repos, ${stats.profile.followers} followers\n`
);
