import { describe, expect, it } from "vitest";
import { resolveApplicationBranch } from "./index";

describe("resolveApplicationBranch", () => {
  it("should return currentBranch when it matches an available branch", () => {
    const result = resolveApplicationBranch(
      "app1-main",
      new Set(["app1-main", "app1-develop"]),
      ["app1-main", "app2-main"],
      "app1-develop"
    );

    expect(result).toBe("app1-main");
  });

  it("should search originalStreams when currentBranch is empty", () => {
    const result = resolveApplicationBranch(
      "",
      new Set(["app1-main", "app1-develop"]),
      ["app1-main", "app2-main"],
      "app1-develop"
    );

    expect(result).toBe("app1-main");
  });

  it("should find the correct entry in originalStreams when currentBranch belongs to a different codebase", () => {
    const result = resolveApplicationBranch(
      "app2-main",
      new Set(["app1-main", "app1-develop"]),
      ["app2-main", "app1-main"],
      "app1-develop"
    );

    expect(result).toBe("app1-main");
  });

  it("should fall back to fallbackBranch when no match in originalStreams", () => {
    const result = resolveApplicationBranch(
      "app2-main",
      new Set(["app1-main", "app1-develop"]),
      ["app2-main", "app3-main"],
      "app1-main"
    );

    expect(result).toBe("app1-main");
  });

  it("should return fallbackBranch when appBranchNames is empty", () => {
    const result = resolveApplicationBranch("app1-main", new Set(), ["app1-main", "app2-main"], "some-fallback");

    expect(result).toBe("some-fallback");
  });

  it("should return fallbackBranch when originalStreams is empty and currentBranch does not match", () => {
    const result = resolveApplicationBranch("app2-main", new Set(["app1-main", "app1-develop"]), [], "app1-main");

    expect(result).toBe("app1-main");
  });

  it("should return undefined when fallbackBranch is undefined and no match found", () => {
    const result = resolveApplicationBranch("app2-main", new Set(["app1-main"]), ["app3-main"], undefined);

    expect(result).toBeUndefined();
  });
});
