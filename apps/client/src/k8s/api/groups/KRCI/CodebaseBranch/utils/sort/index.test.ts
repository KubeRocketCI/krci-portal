import { describe, expect, test } from "vitest";
import { sortCodebaseBranches, sortCodebaseBranchesMap } from "./index";
import type { Codebase, CodebaseBranch } from "@my-project/shared";

describe("sortCodebaseBranches", () => {
  test("sorts branches with default branch first", () => {
    const codebase: Codebase = {
      metadata: { name: "test-codebase" },
      spec: { defaultBranch: "main" },
    } as Codebase;

    const branches: CodebaseBranch[] = [
      { metadata: { name: "feature-branch" }, spec: { branchName: "feature-branch" } } as CodebaseBranch,
      { metadata: { name: "main" }, spec: { branchName: "main" } } as CodebaseBranch,
      { metadata: { name: "develop" }, spec: { branchName: "develop" } } as CodebaseBranch,
    ];

    const sorted = sortCodebaseBranches(branches, codebase);

    expect(sorted[0].metadata.name).toBe("main");
    expect(sorted.length).toBe(3);
  });

  test("handles empty array", () => {
    const codebase: Codebase = {
      metadata: { name: "test-codebase" },
      spec: { defaultBranch: "main" },
    } as Codebase;

    const sorted = sortCodebaseBranches([], codebase);
    expect(sorted).toEqual([]);
  });

  test("handles single branch", () => {
    const codebase: Codebase = {
      metadata: { name: "test-codebase" },
      spec: { defaultBranch: "main" },
    } as Codebase;

    const branches: CodebaseBranch[] = [{ metadata: { name: "main" }, spec: { branchName: "main" } } as CodebaseBranch];

    const sorted = sortCodebaseBranches(branches, codebase);
    expect(sorted[0].metadata.name).toBe("main");
  });

  test("handles case when default branch is not in list", () => {
    const codebase: Codebase = {
      metadata: { name: "test-codebase" },
      spec: { defaultBranch: "main" },
    } as Codebase;

    const branches: CodebaseBranch[] = [
      { metadata: { name: "feature-1" }, spec: { branchName: "feature-1" } } as CodebaseBranch,
      { metadata: { name: "feature-2" }, spec: { branchName: "feature-2" } } as CodebaseBranch,
    ];

    const sorted = sortCodebaseBranches(branches, codebase);
    expect(sorted.length).toBe(2);
  });
});

describe("sortCodebaseBranchesMap", () => {
  test("sorts Map with default branch first", () => {
    const codebase: Codebase = {
      metadata: { name: "test-codebase" },
      spec: { defaultBranch: "main" },
    } as Codebase;

    const branchesMap = new Map<string, CodebaseBranch>([
      [
        "feature-branch",
        { metadata: { name: "feature-branch" }, spec: { branchName: "feature-branch" } } as CodebaseBranch,
      ],
      ["main", { metadata: { name: "main" }, spec: { branchName: "main" } } as CodebaseBranch],
      ["develop", { metadata: { name: "develop" }, spec: { branchName: "develop" } } as CodebaseBranch],
    ]);

    const sorted = sortCodebaseBranchesMap(branchesMap, codebase);

    const entries = Array.from(sorted.entries());
    expect(entries[0][0]).toBe("main");
    expect(entries.length).toBe(3);
  });

  test("handles empty Map", () => {
    const codebase: Codebase = {
      metadata: { name: "test-codebase" },
      spec: { defaultBranch: "main" },
    } as Codebase;

    const sorted = sortCodebaseBranchesMap(new Map(), codebase);
    expect(sorted.size).toBe(0);
  });

  test("preserves Map structure with correct keys", () => {
    const codebase: Codebase = {
      metadata: { name: "test-codebase" },
      spec: { defaultBranch: "main" },
    } as Codebase;

    const branchesMap = new Map<string, CodebaseBranch>([
      ["branch-1", { metadata: { name: "branch-1" }, spec: { branchName: "branch-1" } } as CodebaseBranch],
      ["main", { metadata: { name: "main" }, spec: { branchName: "main" } } as CodebaseBranch],
    ]);

    const sorted = sortCodebaseBranchesMap(branchesMap, codebase);

    expect(sorted.has("main")).toBe(true);
    expect(sorted.has("branch-1")).toBe(true);
    expect(sorted.get("main")?.metadata.name).toBe("main");
  });
});
