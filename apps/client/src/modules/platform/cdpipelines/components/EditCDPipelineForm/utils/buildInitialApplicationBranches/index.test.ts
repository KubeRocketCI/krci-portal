import { describe, expect, it } from "vitest";
import { buildInitialApplicationBranches } from "./index";

describe("buildInitialApplicationBranches", () => {
  it("should match branches to apps correctly when arrays are aligned", () => {
    const applications = ["app-1", "app-2", "app-3"];
    const inputDockerStreams = ["app-1-main", "app-2-develop", "app-3-feature-abc"];

    const result = buildInitialApplicationBranches(applications, inputDockerStreams);

    expect(result).toEqual([
      { appName: "app-1", appBranch: "app-1-main" },
      { appName: "app-2", appBranch: "app-2-develop" },
      { appName: "app-3", appBranch: "app-3-feature-abc" },
    ]);
  });

  it("should match branches to apps correctly when arrays are misaligned", () => {
    const applications = ["frontend-service", "backend-api", "database-manager"];
    const inputDockerStreams = ["database-manager-main", "backend-api-develop", "frontend-service-feature-123"];

    const result = buildInitialApplicationBranches(applications, inputDockerStreams);

    expect(result).toEqual([
      { appName: "frontend-service", appBranch: "frontend-service-feature-123" },
      { appName: "backend-api", appBranch: "backend-api-develop" },
      { appName: "database-manager", appBranch: "database-manager-main" },
    ]);
  });

  it("should handle branches with hash suffixes", () => {
    const applications = ["app-1", "app-2"];
    const inputDockerStreams = ["app-1-feature-xyz-a1b2c", "app-2-bugfix-123-d4e5f"];

    const result = buildInitialApplicationBranches(applications, inputDockerStreams);

    expect(result).toEqual([
      { appName: "app-1", appBranch: "app-1-feature-xyz-a1b2c" },
      { appName: "app-2", appBranch: "app-2-bugfix-123-d4e5f" },
    ]);
  });

  it("should return empty appBranch when no match is found", () => {
    const applications = ["app-1", "app-2"];
    const inputDockerStreams = ["app-3-main", "app-4-develop"];

    const result = buildInitialApplicationBranches(applications, inputDockerStreams);

    expect(result).toEqual([
      { appName: "app-1", appBranch: "" },
      { appName: "app-2", appBranch: "" },
    ]);
  });

  it("should find the first match when multiple branches belong to the same app", () => {
    const applications = ["app-1"];
    const inputDockerStreams = ["app-1-main", "app-1-develop", "app-1-feature"];

    const result = buildInitialApplicationBranches(applications, inputDockerStreams);

    expect(result).toEqual([{ appName: "app-1", appBranch: "app-1-main" }]);
  });

  it("should handle empty inputDockerStreams", () => {
    const applications = ["app-1", "app-2"];
    const inputDockerStreams: string[] = [];

    const result = buildInitialApplicationBranches(applications, inputDockerStreams);

    expect(result).toEqual([
      { appName: "app-1", appBranch: "" },
      { appName: "app-2", appBranch: "" },
    ]);
  });

  it("should handle empty applications", () => {
    const applications: string[] = [];
    const inputDockerStreams = ["app-1-main", "app-2-main"];

    const result = buildInitialApplicationBranches(applications, inputDockerStreams);

    expect(result).toEqual([]);
  });

  it("should handle app names that are prefixes of other app names", () => {
    const applications = ["app", "app-extended"];
    const inputDockerStreams = ["app-extended-main", "app-main"];

    const result = buildInitialApplicationBranches(applications, inputDockerStreams);

    expect(result).toEqual([
      { appName: "app", appBranch: "app-main" },
      { appName: "app-extended", appBranch: "app-extended-main" },
    ]);
  });
});
