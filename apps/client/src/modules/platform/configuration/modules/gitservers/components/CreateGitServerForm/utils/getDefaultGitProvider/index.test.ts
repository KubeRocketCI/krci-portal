import { describe, expect, it } from "vitest";
import { GitProvider, gitProvider } from "@my-project/shared";
import { getDefaultGitProvider } from "./index";

describe("getDefaultGitProvider", () => {
  it("returns github when no provider is used", () => {
    expect(getDefaultGitProvider(new Set())).toBe(gitProvider.github);
  });

  it("returns github when only other providers are used", () => {
    expect(getDefaultGitProvider(new Set<GitProvider>([gitProvider.gerrit]))).toBe(gitProvider.github);
  });

  it("returns the first free provider in enum order when github is used", () => {
    expect(getDefaultGitProvider(new Set<GitProvider>([gitProvider.github]))).toBe(gitProvider.gerrit);
    expect(getDefaultGitProvider(new Set<GitProvider>([gitProvider.github, gitProvider.gerrit]))).toBe(
      gitProvider.gitlab
    );
  });

  it("returns undefined when every provider is used", () => {
    expect(getDefaultGitProvider(new Set<GitProvider>(Object.values(gitProvider)))).toBeUndefined();
  });
});
