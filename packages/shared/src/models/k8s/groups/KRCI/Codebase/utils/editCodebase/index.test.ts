import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { editCodebaseObject } from "./index.js";

const mockCodebase = {
  apiVersion: "v2.edp.epam.com/v1",
  kind: "Codebase",
  metadata: {
    name: "test-codebase",
    namespace: "default",
    creationTimestamp: "2023-01-01T00:00:00Z",
    uid: "test-uid-123",
    labels: {
      "app.edp.epam.com/codebaseType": "application",
    },
  },
  spec: {
    buildTool: "gradle",
    ciTool: "tekton",
    commitMessagePattern: null,
    defaultBranch: "main",
    deploymentScript: "helm-chart",
    description: null,
    emptyProject: true,
    framework: "java11",
    gitServer: "gerrit",
    gitUrlPath: "/test-repo",
    jiraIssueMetadataPayload: null,
    jiraServer: null,
    lang: "Java",
    private: false,
    repository: null,
    strategy: "create",
    ticketNamePattern: null,
    type: "application",
    versioning: {
      type: "edp",
      startFrom: "0.0.0-SNAPSHOT",
    },
  },
} as const;

describe("editCodebaseObject", () => {
  it("should update editable fields", () => {
    const input = {
      jiraServer: "jira-server",
      commitMessagePattern: "^[A-Z]+-\\d+",
      ticketNamePattern: "PROJ-\\d+",
      jiraIssueMetadataPayload: '{"key": "value"}',
    };

    const result = editCodebaseObject(mockCodebase as any, input);

    expect(result.spec.jiraServer).toBe("jira-server");
    expect(result.spec.commitMessagePattern).toBe("^[A-Z]+-\\d+");
    expect(result.spec.ticketNamePattern).toBe("PROJ-\\d+");
    expect(result.spec.jiraIssueMetadataPayload).toBe('{"key": "value"}');
  });

  it("should preserve non-editable fields", () => {
    const input = {
      jiraServer: "updated",
      commitMessagePattern: null,
      ticketNamePattern: null,
      jiraIssueMetadataPayload: null,
    };

    const result = editCodebaseObject(mockCodebase as any, input);

    expect(result.metadata).toEqual(mockCodebase.metadata);
    expect(result.apiVersion).toBe(mockCodebase.apiVersion);
    expect(result.kind).toBe(mockCodebase.kind);
    expect(result.spec.buildTool).toBe("gradle");
    expect(result.spec.type).toBe("application");
  });

  it("should allow null values for optional fields", () => {
    const input = {
      jiraServer: null,
      commitMessagePattern: null,
      ticketNamePattern: null,
      jiraIssueMetadataPayload: null,
    };

    const result = editCodebaseObject(mockCodebase as any, input);

    expect(result.spec.jiraServer).toBeNull();
    expect(result.spec.commitMessagePattern).toBeNull();
  });

  it("should throw ZodError on invalid input types", () => {
    expect(() =>
      editCodebaseObject(mockCodebase as any, {
        jiraServer: 123 as any,
        commitMessagePattern: null,
        ticketNamePattern: null,
        jiraIssueMetadataPayload: null,
      })
    ).toThrow(ZodError);
  });

  it("should not throw for a live codebase whose spec/status diverge from the strict schema", () => {
    // Mirrors a real imported codebase: the operator omits `spec.repository`
    // entirely (the schema marks it nullable-but-required) and attaches a full
    // status subresource. Editing must still succeed and all server-managed
    // fields must be preserved untouched.
    const { repository: _omitted, ...specWithoutRepository } = mockCodebase.spec;
    const liveCodebase = {
      ...mockCodebase,
      spec: specWithoutRepository,
      status: {
        action: "setup_deployment_templates",
        available: true,
        failureCount: 0,
        git: "templates_pushed",
        lastTimeUpdated: "2024-05-28T10:00:00Z",
        result: "success",
        status: "created",
        username: "system",
        value: "active",
        webHookRef: "12345",
      },
    };

    const input = {
      jiraServer: null,
      commitMessagePattern: "^(EPMCDME-\\d+:.*)$",
      ticketNamePattern: null,
      jiraIssueMetadataPayload: null,
    };

    const result = editCodebaseObject(liveCodebase as any, input);

    expect(result.spec.commitMessagePattern).toBe("^(EPMCDME-\\d+:.*)$");
    expect("repository" in result.spec).toBe(false);
    expect((result as any).status).toEqual(liveCodebase.status);
  });
});
