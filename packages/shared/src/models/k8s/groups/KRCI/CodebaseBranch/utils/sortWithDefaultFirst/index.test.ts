import { describe, expect, it } from "vitest";
import type { CodebaseBranchLike } from "./index.js";
import { sortCodebaseBranchesWithDefaultFirst } from "./index.js";

const branch = (name: string, branchName: string, creationTimestamp: string): CodebaseBranchLike =>
  ({
    metadata: { name, creationTimestamp },
    spec: { branchName },
  }) as CodebaseBranchLike;

describe("sortCodebaseBranchesWithDefaultFirst", () => {
  it("puts default branch first, keeps others sorted by creation time", () => {
    const older = branch("b-old", "feature", "2020-01-01T00:00:00Z");
    const newer = branch("b-new", "develop", "2024-01-01T00:00:00Z");
    const main = branch("b-main", "main", "2022-01-01T00:00:00Z");

    const result = sortCodebaseBranchesWithDefaultFirst([older, newer, main], "main");

    expect(result.map((b) => b.spec.branchName)).toEqual(["main", "develop", "feature"]);
  });

  it("returns timestamp order when no default name is set", () => {
    const a = branch("a", "x", "2020-01-01T00:00:00Z");
    const b = branch("b", "y", "2024-01-01T00:00:00Z");
    expect(sortCodebaseBranchesWithDefaultFirst([a, b], undefined).map((x) => x.spec.branchName)).toEqual(["y", "x"]);
  });

  it("no-op when default is already first after timestamp sort", () => {
    const main = branch("m", "main", "2024-01-01T00:00:00Z");
    const other = branch("o", "other", "2020-01-01T00:00:00Z");
    const result = sortCodebaseBranchesWithDefaultFirst([other, main], "main");
    expect(result[0].spec.branchName).toBe("main");
  });
});
