import { describe, expect, test } from "vitest";
import { httpsUrlSchema, isHttpsUrl, optionalHttpsUrlSchema } from "@/lib/urls";

describe("https-only URLs", () => {
  test.each([
    "https://github.com/owner/repo",
    "https://github.com/owner/repo.git",
    "https://gitlab.com/group/sub/repo",
    "https://example.com:8443/path?q=1#top",
  ])("accepts %s", (url) => expect(isHttpsUrl(url)).toBe(true));

  test.each([
    "http://github.com/owner/repo",
    "javascript:alert(1)",
    "git@github.com:owner/repo.git",
    "ssh://git@github.com/owner/repo",
    "ftp://example.com/file",
    "https://",
    "https:///path",
    "https://exa mple.com",
    "github.com/owner/repo",
    "HTTPS://example.com",
    `https://example.com/${"a".repeat(2048)}`,
  ])("rejects %s", (url) => expect(isHttpsUrl(url)).toBe(false));

  test("required URLs trim input and explain what is wrong", () => {
    const schema = httpsUrlSchema("Enter the repository URL.");
    expect(schema.parse("  https://github.com/a/b  ")).toBe("https://github.com/a/b");
    expect(schema.safeParse("").error?.issues[0].message).toBe("Enter the repository URL.");
    expect(schema.safeParse("http://github.com/a/b").error?.issues[0].message)
      .toBe("Enter a full URL that starts with https://.");
  });

  test("optional URLs turn an empty value into null", () => {
    expect(optionalHttpsUrlSchema().parse(" ")).toBeNull();
    expect(optionalHttpsUrlSchema().safeParse("http://example.com").success).toBe(false);
  });
});
