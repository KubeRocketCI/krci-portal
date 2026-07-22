import { describe, it, expect } from "vitest";
import { gitProvider, type Codebase } from "@my-project/shared";
import { findOnboardedProject, getRepoMembershipKey, isGerritProvider } from "./utils";

describe("isGerritProvider", () => {
  it("is true for the gerrit provider", () => {
    expect(isGerritProvider(gitProvider.gerrit)).toBe(true);
  });

  it("is false for non-gerrit providers", () => {
    expect(isGerritProvider(gitProvider.github)).toBe(false);
    expect(isGerritProvider(gitProvider.gitlab)).toBe(false);
    expect(isGerritProvider(gitProvider.bitbucket)).toBe(false);
  });

  it("is false for empty / nullish provider values", () => {
    expect(isGerritProvider("")).toBe(false);
    expect(isGerritProvider(null)).toBe(false);
    expect(isGerritProvider(undefined)).toBe(false);
  });
});

const makeCodebase = (name: string, gitUrlPath: string): Codebase =>
  ({
    metadata: { name },
    spec: { gitUrlPath },
  }) as Codebase;

describe("findOnboardedProject", () => {
  const codebases = [makeCodebase("my-app", "/org/repo"), makeCodebase("other-app", "/org/other.git")];

  it("finds a project by normalized path regardless of slash, case and .git suffix", () => {
    expect(findOnboardedProject(codebases, "org/repo")).toBe("my-app");
    expect(findOnboardedProject(codebases, "/Org/Repo.git")).toBe("my-app");
    expect(findOnboardedProject(codebases, "org/other")).toBe("other-app");
  });

  it("returns undefined when no project uses the path", () => {
    expect(findOnboardedProject(codebases, "org/unused")).toBeUndefined();
  });

  it("returns undefined for an empty candidate", () => {
    expect(findOnboardedProject(codebases, "")).toBeUndefined();
    expect(findOnboardedProject(codebases, "/")).toBeUndefined();
  });
});

describe("getRepoMembershipKey", () => {
  it("is order-independent", () => {
    const a = makeCodebase("a", "/org/a");
    const b = makeCodebase("b", "/org/b");

    expect(getRepoMembershipKey([a, b])).toBe(getRepoMembershipKey([b, a]));
  });

  it("changes when membership changes", () => {
    const a = makeCodebase("a", "/org/a");
    const b = makeCodebase("b", "/org/b");

    expect(getRepoMembershipKey([a])).not.toBe(getRepoMembershipKey([a, b]));
  });
});
