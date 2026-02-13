import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { editCodebaseBranchObject } from "./index.js";

const mockCodebaseBranch = {
  apiVersion: "v2.edp.epam.com/v1",
  kind: "CodebaseBranch",
  metadata: {
    name: "test-codebase-main",
    namespace: "default",
    creationTimestamp: "2023-01-01T00:00:00Z",
    uid: "test-uid-123",
    labels: {
      "app.edp.epam.com/codebaseName": "test-codebase",
    },
  },
  spec: {
    branchName: "main",
    codebaseName: "test-codebase",
    fromCommit: "",
    pipelines: { build: "old-build-pipeline", review: "old-review-pipeline" },
    release: false,
    version: null,
  },
} as const;

describe("editCodebaseBranchObject", () => {
  it("should update pipelines", () => {
    const input = {
      pipelines: { build: "new-build-pipeline", review: "new-review-pipeline" },
    };

    const result = editCodebaseBranchObject(mockCodebaseBranch as any, input);

    expect(result.spec.pipelines).toEqual({ build: "new-build-pipeline", review: "new-review-pipeline" });
  });

  it("should preserve non-editable fields", () => {
    const input = {
      pipelines: { build: "updated" },
    };

    const result = editCodebaseBranchObject(mockCodebaseBranch as any, input);

    expect(result.metadata).toEqual(mockCodebaseBranch.metadata);
    expect(result.spec.branchName).toBe("main");
    expect(result.spec.codebaseName).toBe("test-codebase");
  });

  it("should allow null pipelines", () => {
    const input = {
      pipelines: null,
    };

    const result = editCodebaseBranchObject(mockCodebaseBranch as any, input);

    expect(result.spec.pipelines).toBeNull();
  });

  it("should throw ZodError on invalid input types", () => {
    expect(() =>
      editCodebaseBranchObject(mockCodebaseBranch as any, {
        pipelines: "not-object" as any,
      })
    ).toThrow(ZodError);
  });
});
