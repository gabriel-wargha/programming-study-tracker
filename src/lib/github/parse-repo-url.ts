export type GitHubRepo = { owner: string; repo: string };

const ownerPattern = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const repoPattern = /^[A-Za-z0-9._-]{1,100}$/;

/**
 * Reads `https://github.com/{owner}/{repo}`, with or without `.git`. Anything
 * else returns null and is saved as a plain link.
 */
export function parseGitHubRepoUrl(value: string): GitHubRepo | null {
  let url: URL;
  try { url = new URL(value); } catch { return null; }
  if (url.protocol !== "https:" || url.hostname !== "github.com" || url.port || url.username || url.password || url.search || url.hash) return null;
  const parts = url.pathname.replace(/\/$/, "").split("/").slice(1);
  if (parts.length !== 2) return null;
  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/, "");
  if (!ownerPattern.test(owner) || !repoPattern.test(repo) || repo === "." || repo === "..") return null;
  return { owner, repo };
}
