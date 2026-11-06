// @vitest-environment node
import { describe, expect, test, vi } from "vitest";
import { fetchRepositoryDetails } from "@/lib/github/client";
import { parseGitHubRepoUrl } from "@/lib/github/parse-repo-url";

describe("parseGitHubRepoUrl", () => {
  test.each([
    ["https://github.com/vercel/next.js", { owner: "vercel", repo: "next.js" }],
    ["https://github.com/vercel/next.js.git", { owner: "vercel", repo: "next.js" }],
    ["https://github.com/owner/repo/", { owner: "owner", repo: "repo" }],
  ])("reads %s", (url, expected) => expect(parseGitHubRepoUrl(url)).toEqual(expected));

  test.each([
    "https://gitlab.com/owner/repo",
    "https://www.github.com/owner/repo",
    "https://github.com.evil.dev/owner/repo",
    "https://github.com@evil.dev/owner/repo",
    "https://user:pass@github.com/owner/repo",
    "https://github.com:8443/owner/repo",
    "http://github.com/owner/repo",
    "https://github.com/owner",
    "https://github.com/owner/repo/tree/main",
    "https://github.com/owner/repo?tab=readme",
    "https://github.com/owner/repo#readme",
    "https://github.com/-bad/repo",
    "https://github.com/owner/..",
    "https://github.com/owner/re%2Fpo",
    "not a url",
  ])("treats %s as a plain link", (url) => expect(parseGitHubRepoUrl(url)).toBeNull());
});

const json = (body: unknown, init: ResponseInit = {}) => new Response(JSON.stringify(body), { status: 200, ...init });
const repo = { owner: "o", repo: "r" };
const ok = () => vi.fn<typeof fetch>(async (input) => {
  const { pathname } = new URL(String(input));
  if (pathname.endsWith("/languages")) return json({ TypeScript: 900, CSS: 100 });
  if (pathname.endsWith("/commits")) return json([{ commit: { committer: { date: "2026-11-01T10:00:00Z" } } }]);
  return json({ full_name: "o/r", description: "A repo", language: "TypeScript", private: false });
});

describe("fetchRepositoryDetails", () => {
  test("reads the repository, languages, and latest commit from api.github.com only", async () => {
    const fetchImpl = ok();
    expect(await fetchRepositoryDetails(repo, { fetchImpl, token: "" })).toEqual({
      ok: true,
      details: {
        fullName: "o/r", description: "A repo", primaryLanguage: "TypeScript",
        languages: { TypeScript: 900, CSS: 100 }, lastCommitAt: new Date("2026-11-01T10:00:00Z"),
      },
    });
    const urls = fetchImpl.mock.calls.map(([input]) => String(input)).sort();
    expect(urls).toEqual([
      "https://api.github.com/repos/o/r",
      "https://api.github.com/repos/o/r/commits?per_page=1",
      "https://api.github.com/repos/o/r/languages",
    ]);
  });

  test("the token is sent only when configured", async () => {
    const withToken = ok();
    await fetchRepositoryDetails(repo, { fetchImpl: withToken, token: "secret" });
    expect(new Headers(withToken.mock.calls[0][1]?.headers).get("authorization")).toBe("Bearer secret");
    const withoutToken = ok();
    await fetchRepositoryDetails(repo, { fetchImpl: withoutToken, token: "" });
    expect(new Headers(withoutToken.mock.calls[0][1]?.headers).has("authorization")).toBe(false);
  });

  test.each([
    [404, {}, "not_found"],
    [403, { "x-ratelimit-remaining": "0" }, "rate_limited"],
    [403, { "retry-after": "60" }, "rate_limited"],
    [429, {}, "rate_limited"],
    [403, {}, "forbidden"],
    [401, {}, "forbidden"],
    [500, {}, "unavailable"],
  ])("HTTP %i with %j means %s", async (status, headers, reason) => {
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response("{}", { status, headers }));
    expect(await fetchRepositoryDetails(repo, { fetchImpl, token: "" })).toEqual({ ok: false, reason });
  });

  test("network errors and unexpected responses do not throw", async () => {
    const down = vi.fn<typeof fetch>(async () => { throw new TypeError("network"); });
    expect(await fetchRepositoryDetails(repo, { fetchImpl: down, token: "" })).toEqual({ ok: false, reason: "unavailable" });
    const odd = vi.fn<typeof fetch>(async () => json({ surprise: true }));
    expect(await fetchRepositoryDetails(repo, { fetchImpl: odd, token: "" })).toEqual({ ok: false, reason: "unavailable" });
  });

  test("an empty repository has no last commit", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (input) => {
      const { pathname } = new URL(String(input));
      if (pathname.endsWith("/commits")) return new Response("{}", { status: 409 });
      if (pathname.endsWith("/languages")) return json({});
      return json({ full_name: "o/r", description: null, language: null });
    });
    expect(await fetchRepositoryDetails(repo, { fetchImpl, token: "" })).toMatchObject({ ok: true, details: { lastCommitAt: null, languages: {} } });
  });

  test("renamed repositories are followed on api.github.com, and other hosts are refused", async () => {
    const renamed = vi.fn<typeof fetch>(async (input) => {
      const url = new URL(String(input));
      if (url.pathname.startsWith("/repos/")) return new Response(null, { status: 301, headers: { location: `https://api.github.com/repositories/1${url.pathname.slice("/repos/o/r".length)}${url.search}` } });
      if (url.pathname.endsWith("/languages")) return json({ Go: 1 });
      if (url.pathname.endsWith("/commits")) return json([]);
      return json({ full_name: "o/new", description: null, language: "Go" });
    });
    expect(await fetchRepositoryDetails(repo, { fetchImpl: renamed, token: "" })).toMatchObject({ ok: true, details: { fullName: "o/new" } });

    const evil = vi.fn<typeof fetch>(async () => new Response(null, { status: 302, headers: { location: "https://evil.dev/steal" } }));
    expect(await fetchRepositoryDetails(repo, { fetchImpl: evil, token: "secret" })).toEqual({ ok: false, reason: "unavailable" });
    for (const [input] of evil.mock.calls) expect(new URL(String(input)).hostname).toBe("api.github.com");
  });
});
