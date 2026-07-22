import { describe, expect, it } from "vitest";
import { normalizeGitUrlPath } from "./index.js";

describe("normalizeGitUrlPath", () => {
  it("strips the leading slash", () => {
    expect(normalizeGitUrlPath("/org/repo")).toBe("org/repo");
  });

  it("keeps a path without leading slash as is", () => {
    expect(normalizeGitUrlPath("org/repo")).toBe("org/repo");
  });

  it("strips the .git suffix, including repeated ones", () => {
    expect(normalizeGitUrlPath("org/repo.git")).toBe("org/repo");
    expect(normalizeGitUrlPath("org/repo.git.git")).toBe("org/repo");
  });

  it("lowercases the path", () => {
    expect(normalizeGitUrlPath("Org/Repo")).toBe("org/repo");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeGitUrlPath("  /org/repo  ")).toBe("org/repo");
  });

  it("normalizes all variants to the same value", () => {
    expect(normalizeGitUrlPath(" /Org/Repo.git ")).toBe(normalizeGitUrlPath("org/repo"));
  });

  it("returns empty string for nullish or empty input", () => {
    expect(normalizeGitUrlPath(null)).toBe("");
    expect(normalizeGitUrlPath(undefined)).toBe("");
    expect(normalizeGitUrlPath("")).toBe("");
  });
});
