import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { editDefaultCodebaseBranchObject } from "./index.js";

const mockDefaultBranch = {
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
    pipelines: null,
    release: false,
    version: "0.0.0-SNAPSHOT",
  },
} as const;

describe("editDefaultCodebaseBranchObject", () => {
  it("should update version", () => {
    const input = { version: "1.0.0-SNAPSHOT" };

    const result = editDefaultCodebaseBranchObject(mockDefaultBranch as any, input);

    expect(result.spec.version).toBe("1.0.0-SNAPSHOT");
  });

  it("should preserve non-editable fields", () => {
    const input = { version: "2.0.0" };

    const result = editDefaultCodebaseBranchObject(mockDefaultBranch as any, input);

    expect(result.metadata).toEqual(mockDefaultBranch.metadata);
    expect(result.spec.branchName).toBe("main");
    expect(result.spec.codebaseName).toBe("test-codebase");
  });

  it("should allow null version", () => {
    const input = { version: null };

    const result = editDefaultCodebaseBranchObject(mockDefaultBranch as any, input);

    expect(result.spec.version).toBeNull();
  });

  it("should throw ZodError on invalid input types", () => {
    expect(() =>
      editDefaultCodebaseBranchObject(mockDefaultBranch as any, {
        version: 123 as any,
      })
    ).toThrow(ZodError);
  });
});
