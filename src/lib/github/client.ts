import "server-only";

import { z } from "zod";
import type { GitHubRepo } from "@/lib/github/parse-repo-url";

export type RepositoryDetails = {
  fullName: string;
  description: string | null;
  primaryLanguage: string | null;
  languages: Record<string, number>;
  lastCommitAt: Date | null;
};
export type GitHubFailure = "not_found" | "forbidden" | "rate_limited" | "unavailable";
export type RepositoryResult = { ok: true; details: RepositoryDetails } | { ok: false; reason: GitHubFailure };
type Fetch = typeof fetch;

const API_HOST = "api.github.com";
const MAX_REDIRECTS = 2;

const repositorySchema = z.object({
  full_name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable(),
  language: z.string().max(100).nullable(),
});
const languagesSchema = z.record(z.string().max(100), z.number().int().nonnegative());
const commitsSchema = z.array(z.object({ commit: z.object({ committer: z.object({ date: z.iso.datetime() }).nullable() }) }));

class GitHubRequestError extends Error {
  constructor(readonly reason: GitHubFailure) { super(reason); }
}

function failureFor(response: Response): GitHubFailure {
  if (response.status === 404) return "not_found";
  if (response.status === 429 || (response.status === 403 && (response.headers.get("x-ratelimit-remaining") === "0" || response.headers.has("retry-after")))) {
    return "rate_limited";
  }
  return response.status === 401 || response.status === 403 ? "forbidden" : "unavailable";
}

/** Sends a GET to api.github.com. Redirects (renamed repositories) are followed only within that host. */
async function request(path: string, token: string | undefined, fetchImpl: Fetch): Promise<Response> {
  let url = new URL(path, `https://${API_HOST}`);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    if (url.protocol !== "https:" || url.hostname !== API_HOST) throw new GitHubRequestError("unavailable");
    const response = await fetchImpl(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "programming-study-tracker",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (response.status < 300 || response.status >= 400) return response;
    const location = response.headers.get("location");
    if (!location) throw new GitHubRequestError("unavailable");
    url = new URL(location, url);
  }
  throw new GitHubRequestError("unavailable");
}

/** Reads public repository details. Never throws for GitHub or network problems. */
export async function fetchRepositoryDetails(
  { owner, repo }: GitHubRepo,
  { fetchImpl = fetch, token = process.env.GITHUB_TOKEN }: { fetchImpl?: Fetch; token?: string } = {},
): Promise<RepositoryResult> {
  const base = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  try {
    const [repository, languages, commits] = await Promise.all([
      request(base, token, fetchImpl),
      request(`${base}/languages`, token, fetchImpl),
      request(`${base}/commits?per_page=1`, token, fetchImpl),
    ]);
    if (!repository.ok) return { ok: false, reason: failureFor(repository) };
    if (!languages.ok) return { ok: false, reason: failureFor(languages) };
    // An empty repository answers 409 for commits; it simply has no last commit.
    if (!commits.ok && commits.status !== 409) return { ok: false, reason: failureFor(commits) };

    const details = repositorySchema.parse(await repository.json());
    const commitList = commits.ok ? commitsSchema.parse(await commits.json()) : [];
    const lastCommit = commitList[0]?.commit.committer?.date;
    return {
      ok: true,
      details: {
        fullName: details.full_name,
        description: details.description,
        primaryLanguage: details.language,
        languages: languagesSchema.parse(await languages.json()),
        lastCommitAt: lastCommit ? new Date(lastCommit) : null,
      },
    };
  } catch (error) {
    return { ok: false, reason: error instanceof GitHubRequestError ? error.reason : "unavailable" };
  }
}
