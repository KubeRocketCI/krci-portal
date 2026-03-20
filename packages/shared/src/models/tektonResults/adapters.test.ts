import { describe, expect, it } from "vitest";
import { normalizeHistoryPipelineRun, normalizeHistoryTaskRun, normalizeHistoryTaskRuns } from "./adapters.js";
import type { DecodedPipelineRun, DecodedTaskRun } from "./types.js";

// Realistic mock data matching real Tekton Results API responses

const mockDecodedPipelineRun: DecodedPipelineRun = {
  apiVersion: "tekton.dev/v1",
  kind: "PipelineRun",
  metadata: {
    name: "review-codemie-main-x77pc",
    namespace: "edp-delivery",
    uid: "abc-123-def-456",
    labels: {
      "app.edp.epam.com/pipelinetype": "review",
      "app.edp.epam.com/codebase": "codemie",
      "app.edp.epam.com/codebasebranch": "codemie-main",
      "tekton.dev/pipeline": "gitlab-poetry-fastapi-app-review",
    },
    annotations: {
      "app.edp.epam.com/git-branch": "main",
      "app.edp.epam.com/git-change-number": "2843",
      "app.edp.epam.com/git-change-url": "https://gitlab.example.com/merge_requests/2843",
      "app.edp.epam.com/git-author": "Oleksandr_Peresunko",
      "app.edp.epam.com/git-avatar": "https://gitlab.example.com/avatar.png",
    },
    creationTimestamp: "2026-03-08T12:10:00Z",
    resourceVersion: "12345",
    generation: 1,
  },
  spec: {
    pipelineRef: { name: "gitlab-poetry-fastapi-app-review" },
    params: [
      { name: "git-source-url", value: "ssh://git@gitlab.example.com/codemie.git" },
      { name: "git-source-revision", value: "main" },
    ],
    workspaces: [{ name: "shared-workspace", emptyDir: {} }],
    serviceAccountName: "tekton",
  },
  status: {
    conditions: [
      {
        type: "Succeeded",
        status: "True",
        reason: "Completed",
        message: "Tasks Completed: 11, Skipped: 0",
        lastTransitionTime: "2026-03-08T12:25:00Z",
      },
    ],
    startTime: "2026-03-08T12:10:03Z",
    completionTime: "2026-03-08T12:25:00Z",
    pipelineSpec: {
      tasks: [
        {
          name: "report-pipeline-start-to-gitlab",
          taskRef: { name: "report-to-gitlab", kind: "Task" },
          params: [{ name: "PIPELINE_STATUS", value: "running" }],
        },
        {
          name: "fetch-repository",
          taskRef: { name: "git-clone", kind: "Task" },
          runAfter: ["report-pipeline-start-to-gitlab"],
        },
        {
          name: "sonar",
          taskRef: { name: "sonarqube-scanner", kind: "Task" },
          runAfter: ["fetch-repository"],
        },
      ],
      finally: [
        {
          name: "report-pipeline-end-to-gitlab",
          taskRef: { name: "report-to-gitlab", kind: "Task" },
        },
      ],
    },
    childReferences: [
      {
        kind: "TaskRun",
        name: "review-codemie-main-x77pc-report-pipeline-start-to-gitlab-pod",
        apiVersion: "tekton.dev/v1",
        pipelineTaskName: "report-pipeline-start-to-gitlab",
      },
      {
        kind: "TaskRun",
        name: "review-codemie-main-x77pc-fetch-repository-pod",
        apiVersion: "tekton.dev/v1",
        pipelineTaskName: "fetch-repository",
      },
    ],
    results: [
      { name: "IMAGES", value: "registry.example.com/codemie:latest" },
      { name: "COMMIT_SHA", value: "abc123def456" },
    ],
  },
};

const mockDecodedTaskRun: DecodedTaskRun = {
  apiVersion: "tekton.dev/v1",
  kind: "TaskRun",
  metadata: {
    name: "review-codemie-main-x77pc-report-pipeline-start-to-gitlab-pod",
    namespace: "edp-delivery",
    uid: "task-uid-001",
    labels: {
      "app.edp.epam.com/pipeline": "gitlab-poetry-fastapi-app-review",
      "app.edp.epam.com/pipelinetype": "review",
      "tekton.dev/pipelineRun": "review-codemie-main-x77pc",
      "tekton.dev/pipelineTask": "report-pipeline-start-to-gitlab",
    },
    annotations: {
      "results.tekton.dev/log": "edp-delivery/results/abc-123/logs/log-uid-001",
    },
    creationTimestamp: "2026-03-08T12:10:05Z",
  },
  spec: {
    params: [{ name: "PIPELINE_STATUS", value: "running" }],
    taskRef: { name: "report-to-gitlab", kind: "Task" },
    serviceAccountName: "tekton",
  },
  status: {
    podName: "review-codemie-main-x77pc-report-pipeline-start-to-gitlab-pod",
    conditions: [
      {
        type: "Succeeded",
        status: "True",
        reason: "Succeeded",
        message: "All Steps have completed executing",
        lastTransitionTime: "2026-03-08T12:11:16Z",
      },
    ],
    steps: [
      {
        name: "set-status",
        container: "step-set-status",
        imageID: "docker.io/curlimages/curl@sha256:abc123",
        terminated: {
          exitCode: 0,
          reason: "Completed",
          startedAt: "2026-03-08T12:10:56Z",
          finishedAt: "2026-03-08T12:11:16Z",
          containerID: "containerd://xyz789",
        },
      },
    ],
    startTime: "2026-03-08T12:10:56Z",
    completionTime: "2026-03-08T12:11:16Z",
    taskResults: [{ name: "REPORT_STATUS", value: "success" }],
    taskSpec: {
      steps: [
        {
          name: "set-status",
          image: "curlimages/curl:latest",
          script: '#!/bin/sh\ncurl -X POST "$GITLAB_URL"',
        },
      ],
    },
  },
};

const mockDecodedTaskRunSonar: DecodedTaskRun = {
  apiVersion: "tekton.dev/v1",
  kind: "TaskRun",
  metadata: {
    name: "review-codemie-main-x77pc-sonar-pod",
    namespace: "edp-delivery",
    uid: "task-uid-002",
    labels: {
      "app.edp.epam.com/pipeline": "gitlab-poetry-fastapi-app-review",
      "app.edp.epam.com/pipelinetype": "review",
      "tekton.dev/pipelineRun": "review-codemie-main-x77pc",
      "tekton.dev/pipelineTask": "sonar",
    },
    creationTimestamp: "2026-03-08T12:15:00Z",
  },
  spec: {
    taskRef: { name: "sonarqube-scanner", kind: "Task" },
  },
  status: {
    podName: "review-codemie-main-x77pc-sonar-pod",
    conditions: [
      {
        type: "Succeeded",
        status: "True",
        reason: "Succeeded",
      },
    ],
    steps: [
      {
        name: "prepare-project",
        container: "step-prepare-project",
        terminated: { exitCode: 0, reason: "Completed" },
      },
      {
        name: "prepare-sonar-project-properties",
        container: "step-prepare-sonar-project-properties",
        terminated: { exitCode: 0, reason: "Completed" },
      },
      {
        name: "sonar-scanner",
        container: "step-sonar-scanner",
        terminated: { exitCode: 0, reason: "Completed" },
      },
    ],
    startTime: "2026-03-08T12:15:00Z",
    completionTime: "2026-03-08T12:18:30Z",
  },
};

describe("normalizeHistoryPipelineRun", () => {
  it("should normalize a decoded PipelineRun to K8s PipelineRun type", () => {
    const result = normalizeHistoryPipelineRun(mockDecodedPipelineRun);

    expect(result.apiVersion).toBe("tekton.dev/v1");
    expect(result.kind).toBe("PipelineRun");
    expect(result.metadata.name).toBe("review-codemie-main-x77pc");
    expect(result.metadata.namespace).toBe("edp-delivery");
    expect(result.metadata.uid).toBe("abc-123-def-456");
    expect(result.metadata.creationTimestamp).toBe("2026-03-08T12:10:00Z");
  });

  it("should preserve labels including required pipelineType", () => {
    const result = normalizeHistoryPipelineRun(mockDecodedPipelineRun);

    expect(result.metadata.labels["app.edp.epam.com/pipelinetype"]).toBe("review");
    expect(result.metadata.labels["app.edp.epam.com/codebase"]).toBe("codemie");
    expect(result.metadata.labels["tekton.dev/pipeline"]).toBe("gitlab-poetry-fastapi-app-review");
  });

  it("should preserve annotations for git metadata", () => {
    const result = normalizeHistoryPipelineRun(mockDecodedPipelineRun);

    expect(result.metadata.annotations?.["app.edp.epam.com/git-branch"]).toBe("main");
    expect(result.metadata.annotations?.["app.edp.epam.com/git-change-number"]).toBe("2843");
    expect(result.metadata.annotations?.["app.edp.epam.com/git-author"]).toBe("Oleksandr_Peresunko");
  });

  it("should lowercase condition reasons to match K8s enum", () => {
    const result = normalizeHistoryPipelineRun(mockDecodedPipelineRun);

    expect(result.status?.conditions?.[0]?.reason).toBe("completed");
    expect(result.status?.conditions?.[0]?.status).toBe("True");
    expect(result.status?.conditions?.[0]?.type).toBe("Succeeded");
  });

  it("should preserve status timing fields", () => {
    const result = normalizeHistoryPipelineRun(mockDecodedPipelineRun);

    expect(result.status?.startTime).toBe("2026-03-08T12:10:03Z");
    expect(result.status?.completionTime).toBe("2026-03-08T12:25:00Z");
  });

  it("should preserve pipelineSpec with tasks and finally", () => {
    const result = normalizeHistoryPipelineRun(mockDecodedPipelineRun);

    expect(result.status?.pipelineSpec?.tasks).toHaveLength(3);
    expect(result.status?.pipelineSpec?.tasks?.[0]?.name).toBe("report-pipeline-start-to-gitlab");
    expect(result.status?.pipelineSpec?.tasks?.[1]?.runAfter).toEqual(["report-pipeline-start-to-gitlab"]);
    expect(result.status?.pipelineSpec?.finally).toHaveLength(1);
  });

  it("should preserve childReferences", () => {
    const result = normalizeHistoryPipelineRun(mockDecodedPipelineRun);

    expect(result.status?.childReferences).toHaveLength(2);
    expect(result.status?.childReferences?.[0]?.pipelineTaskName).toBe("report-pipeline-start-to-gitlab");
  });

  it("should preserve status.results", () => {
    const result = normalizeHistoryPipelineRun(mockDecodedPipelineRun);

    expect(result.status?.results).toHaveLength(2);
    expect(result.status?.results?.[0]?.name).toBe("IMAGES");
    expect(result.status?.results?.[0]?.value).toBe("registry.example.com/codemie:latest");
    expect(result.status?.results?.[1]?.name).toBe("COMMIT_SHA");
  });

  it("should handle missing status.results gracefully", () => {
    const decoded: DecodedPipelineRun = {
      ...mockDecodedPipelineRun,
      status: {
        ...mockDecodedPipelineRun.status,
        results: undefined,
      },
    };

    const result = normalizeHistoryPipelineRun(decoded);
    expect(result.status?.results).toBeUndefined();
  });

  it("should preserve spec fields", () => {
    const result = normalizeHistoryPipelineRun(mockDecodedPipelineRun);

    expect(result.spec.pipelineRef?.name).toBe("gitlab-poetry-fastapi-app-review");
    expect(result.spec.params).toHaveLength(2);
  });

  it("should preserve spec.pipelineSpec for archived inline pipelines", () => {
    const decoded: DecodedPipelineRun = {
      ...mockDecodedPipelineRun,
      spec: {
        ...mockDecodedPipelineRun.spec,
        pipelineSpec: {
          tasks: [{ name: "inline-only-task", taskRef: { name: "git-clone", kind: "Task" } }],
        },
      },
      status: {
        ...mockDecodedPipelineRun.status,
        pipelineSpec: undefined,
      },
    };

    const result = normalizeHistoryPipelineRun(decoded);

    expect(result.spec.pipelineSpec?.tasks).toHaveLength(1);
    expect(result.spec.pipelineSpec?.tasks?.[0]?.name).toBe("inline-only-task");
  });

  it("should use startTime as fallback for missing creationTimestamp", () => {
    const decoded: DecodedPipelineRun = {
      ...mockDecodedPipelineRun,
      metadata: {
        ...mockDecodedPipelineRun.metadata,
        creationTimestamp: undefined,
      },
    };

    const result = normalizeHistoryPipelineRun(decoded);
    expect(result.metadata.creationTimestamp).toBe("2026-03-08T12:10:03Z");
  });

  it("should handle missing labels gracefully", () => {
    const decoded: DecodedPipelineRun = {
      ...mockDecodedPipelineRun,
      metadata: {
        ...mockDecodedPipelineRun.metadata,
        labels: undefined,
      },
    };

    const result = normalizeHistoryPipelineRun(decoded);
    expect(result.metadata.labels).toEqual({});
  });

  it("should handle missing annotations gracefully", () => {
    const decoded: DecodedPipelineRun = {
      ...mockDecodedPipelineRun,
      metadata: {
        ...mockDecodedPipelineRun.metadata,
        annotations: undefined,
      },
    };

    const result = normalizeHistoryPipelineRun(decoded);
    expect(result.metadata.annotations).toEqual({});
  });
});

describe("normalizeHistoryTaskRun", () => {
  it("should normalize a decoded TaskRun to K8s TaskRun type", () => {
    const result = normalizeHistoryTaskRun(mockDecodedTaskRun);

    expect(result.apiVersion).toBe("tekton.dev/v1");
    expect(result.kind).toBe("TaskRun");
    expect(result.metadata.name).toBe("review-codemie-main-x77pc-report-pipeline-start-to-gitlab-pod");
    expect(result.metadata.namespace).toBe("edp-delivery");
    expect(result.metadata.uid).toBe("task-uid-001");
  });

  it("should preserve required TaskRun labels", () => {
    const result = normalizeHistoryTaskRun(mockDecodedTaskRun);

    expect(result.metadata.labels["app.edp.epam.com/pipeline"]).toBe("gitlab-poetry-fastapi-app-review");
    expect(result.metadata.labels["app.edp.epam.com/pipelinetype"]).toBe("review");
    expect(result.metadata.labels["tekton.dev/pipelineRun"]).toBe("review-codemie-main-x77pc");
    expect(result.metadata.labels["tekton.dev/pipelineTask"]).toBe("report-pipeline-start-to-gitlab");
  });

  it("should preserve status.podName (required field)", () => {
    const result = normalizeHistoryTaskRun(mockDecodedTaskRun);

    expect(result.status?.podName).toBe("review-codemie-main-x77pc-report-pipeline-start-to-gitlab-pod");
  });

  it("should preserve step details with terminated state", () => {
    const result = normalizeHistoryTaskRun(mockDecodedTaskRun);

    expect(result.status?.steps).toHaveLength(1);
    expect(result.status?.steps?.[0]?.name).toBe("set-status");
    expect(result.status?.steps?.[0]?.container).toBe("step-set-status");
    expect(result.status?.steps?.[0]?.terminated?.exitCode).toBe(0);
  });

  it("should preserve timing fields", () => {
    const result = normalizeHistoryTaskRun(mockDecodedTaskRun);

    expect(result.status?.startTime).toBe("2026-03-08T12:10:56Z");
    expect(result.status?.completionTime).toBe("2026-03-08T12:11:16Z");
  });

  it("should preserve taskResults", () => {
    const result = normalizeHistoryTaskRun(mockDecodedTaskRun);

    expect(result.status?.taskResults).toHaveLength(1);
    expect(result.status?.taskResults?.[0]?.name).toBe("REPORT_STATUS");
    expect(result.status?.taskResults?.[0]?.value).toBe("success");
  });

  it("should lowercase condition reasons", () => {
    const result = normalizeHistoryTaskRun(mockDecodedTaskRun);

    expect(result.status?.conditions?.[0]?.reason).toBe("succeeded");
    expect(result.status?.conditions?.[0]?.status).toBe("True");
  });

  it("should preserve spec fields", () => {
    const result = normalizeHistoryTaskRun(mockDecodedTaskRun);

    expect(result.spec.taskRef?.name).toBe("report-to-gitlab");
    expect(result.spec.params).toHaveLength(1);
  });
});

describe("normalizeHistoryTaskRuns", () => {
  it("should normalize multiple decoded TaskRuns", () => {
    const results = normalizeHistoryTaskRuns([mockDecodedTaskRun, mockDecodedTaskRunSonar]);

    expect(results).toHaveLength(2);
    expect(results[0].metadata.name).toBe("review-codemie-main-x77pc-report-pipeline-start-to-gitlab-pod");
    expect(results[1].metadata.name).toBe("review-codemie-main-x77pc-sonar-pod");
  });

  it("should preserve multi-step task data", () => {
    const results = normalizeHistoryTaskRuns([mockDecodedTaskRunSonar]);

    expect(results[0].status?.steps).toHaveLength(3);
    expect(results[0].status?.steps?.[0]?.name).toBe("prepare-project");
    expect(results[0].status?.steps?.[1]?.name).toBe("prepare-sonar-project-properties");
    expect(results[0].status?.steps?.[2]?.name).toBe("sonar-scanner");
  });

  it("should handle empty array", () => {
    const results = normalizeHistoryTaskRuns([]);
    expect(results).toEqual([]);
  });

  it("should handle TaskRun with missing optional fields", () => {
    const minimal: DecodedTaskRun = {
      apiVersion: "tekton.dev/v1",
      kind: "TaskRun",
      metadata: {
        name: "minimal-taskrun",
        namespace: "default",
        uid: "minimal-uid",
      },
      spec: {},
      status: {
        podName: "minimal-pod",
      },
    };

    const results = normalizeHistoryTaskRuns([minimal]);

    expect(results).toHaveLength(1);
    expect(results[0].metadata.name).toBe("minimal-taskrun");
    expect(results[0].status?.podName).toBe("minimal-pod");
    expect(results[0].metadata.labels).toEqual({});
    expect(results[0].status?.steps).toBeUndefined();
    expect(results[0].status?.conditions).toBeUndefined();
  });
});
