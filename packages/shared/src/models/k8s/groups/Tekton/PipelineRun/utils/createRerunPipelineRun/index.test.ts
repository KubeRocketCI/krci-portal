import { v4 as uuidv4 } from "uuid";
import { createRerunPipelineRun } from "./index.js";
import { createGracefulCancelPipelineRun } from "../createGracefulCancelPipelineRun/index.js";
import { PipelineRun } from "../../types.js";
import { vi, Mock, describe, expect, it } from "vitest";

vi.mock("uuid", () => ({
  v4: vi.fn(),
}));

const MOCKED_UUID = "1234";
(uuidv4 as Mock).mockReturnValue(MOCKED_UUID);

describe("testing createRerunPipelineRun", () => {
  it("should return a new pipeline run instance with the correct name", () => {
    const object = createRerunPipelineRun({
      apiVersion: "tekton.dev/v1",
      kind: "PipelineRun",
      // @ts-ignore
      metadata: {
        annotations: {
          "argocd.argoproj.io/compare-options": "IgnoreExtraneous",
          "results.tekton.dev/result": "krci/results/5187e897-8686-42e3-8fbf-1cc0de1b83b7",
          "results.tekton.dev/record": "krci/results/5187e897-8686-42e3-8fbf-1cc0de1b83b7/records/abc123",
          "results.tekton.dev/log": "krci/results/5187e897-8686-42e3-8fbf-1cc0de1b83b7/logs/def456",
          "results.tekton.dev/resultAnnotations": JSON.stringify({
            "app.edp.epam.com/git-branch": "main",
            "app.edp.epam.com/git-author": "test-user",
            "app.edp.epam.com/git-change-number": "#270",
          }),
        },
        name: `build-test-codebase-name-test-codebase-branch-name-very-lo-${MOCKED_UUID}`,
        labels: {
          "app.edp.epam.com/codebase": "test-codebase-name",
          "app.edp.epam.com/codebasebranch": "test-codebase-name-test-codebase-branch-name-very-long-long-name",
          "app.edp.epam.com/pipelinetype": "build",
          "tekton.dev/pipeline": "test-build-pipeline",
          "triggers.tekton.dev/trigger": "github-review",
          "triggers.tekton.dev/eventlistener": "edp-github",
          "triggers.tekton.dev/triggers-eventid": "5187e897-8686-42e3-8fbf-1cc0de1b83b7",
        },
      },
      spec: {
        params: [
          {
            name: "git-source-url",
            value: "ssh://test-git-user@test-git-host:123/test-git-url-path",
          },
          {
            name: "git-source-revision",
            value: "test-codebase-branch-name",
          },
          { name: "CODEBASE_NAME", value: "test-codebase-name" },
          {
            name: "CODEBASEBRANCH_NAME",
            value: "test-codebase-name-test-codebase-branch-name-very-long-long-name",
          },
          { name: "changeNumber", value: "1" },
          { name: "patchsetNumber", value: "1" },
          { name: "TICKET_NAME_PATTERN", value: "" },
          { name: "COMMIT_MESSAGE_PATTERN", value: "" },
          { name: "COMMIT_MESSAGE", value: "" },
          { name: "JIRA_ISSUE_METADATA_PAYLOAD", value: "" },
          { name: "JIRA_SERVER", value: "" },
          { name: "gitfullrepositoryname", value: "test-git-url-path" },
        ],
        pipelineRef: { name: "test-build-pipeline" },
        taskRunTemplate: { serviceAccountName: "tekton" },
        workspaces: [
          // @ts-ignore
          {
            name: "shared-workspace",
            subPath: "codebase",
            volumeClaimTemplate: {
              spec: {
                accessModes: ["ReadWriteOnce"],
                resources: { requests: { storage: "5Gi" } },
              },
            },
          },
          // @ts-ignore
          { name: "ssh-creds", secret: { secretName: "secretName" } },
          // @ts-ignore
          {
            name: "settings",
            configMap: { name: "custom-test-build-tool-settings" },
          },
        ],
      },
    });

    expect(object).toEqual({
      apiVersion: "tekton.dev/v1",
      kind: "PipelineRun",
      metadata: {
        annotations: {
          "argocd.argoproj.io/compare-options": "IgnoreExtraneous",
          "results.tekton.dev/resultAnnotations": JSON.stringify({
            "app.edp.epam.com/git-branch": "main",
            "app.edp.epam.com/git-author": "test-user",
            "app.edp.epam.com/git-change-number": "#270",
          }),
        },
        name: "r-build-test-codebase-name-test-codebase-branch-name-very--1234",
        labels: {
          "app.edp.epam.com/codebase": "test-codebase-name",
          "app.edp.epam.com/codebasebranch": "test-codebase-name-test-codebase-branch-name-very-long-long-name",
          "app.edp.epam.com/pipelinetype": "build",
          "dashboard.tekton.dev/rerunOf": "build-test-codebase-name-test-codebase-branch-name-very-lo-1234",
        },
      },
      spec: {
        params: [
          {
            name: "git-source-url",
            value: "ssh://test-git-user@test-git-host:123/test-git-url-path",
          },
          {
            name: "git-source-revision",
            value: "test-codebase-branch-name",
          },
          { name: "CODEBASE_NAME", value: "test-codebase-name" },
          {
            name: "CODEBASEBRANCH_NAME",
            value: "test-codebase-name-test-codebase-branch-name-very-long-long-name",
          },
          { name: "changeNumber", value: "1" },
          { name: "patchsetNumber", value: "1" },
          { name: "TICKET_NAME_PATTERN", value: "" },
          { name: "COMMIT_MESSAGE_PATTERN", value: "" },
          { name: "COMMIT_MESSAGE", value: "" },
          { name: "JIRA_ISSUE_METADATA_PAYLOAD", value: "" },
          { name: "JIRA_SERVER", value: "" },
          { name: "gitfullrepositoryname", value: "test-git-url-path" },
        ],
        pipelineRef: { name: "test-build-pipeline" },
        taskRunTemplate: { serviceAccountName: "tekton" },
        workspaces: [
          {
            name: "shared-workspace",
            subPath: "codebase",
            volumeClaimTemplate: {
              spec: {
                accessModes: ["ReadWriteOnce"],
                resources: { requests: { storage: "5Gi" } },
              },
            },
          },
          { name: "ssh-creds", secret: { secretName: "secretName" } },
          {
            name: "settings",
            configMap: { name: "custom-test-build-tool-settings" },
          },
        ],
      },
    });
  });

  it("should not carry over the queue-cancel-reason annotation of the stopped run", () => {
    const object = createRerunPipelineRun(
      createGracefulCancelPipelineRun({
        apiVersion: "tekton.dev/v1",
        kind: "PipelineRun",
        metadata: {
          name: "test-pipeline-run",
          namespace: "edp",
        },
        spec: {
          pipelineRef: { name: "test-build-pipeline" },
        },
      } as unknown as PipelineRun)
    );

    expect(object.metadata.annotations).not.toHaveProperty("app.edp.epam.com/queue-cancel-reason");
  });

  // Losing tekton.dev/pipeline off the cached run blanks the Pipeline name on the
  // details page that rendered the menu.
  it("should not mutate the labels or annotations of the original pipeline run", () => {
    const original = {
      apiVersion: "tekton.dev/v1",
      kind: "PipelineRun",
      metadata: {
        name: "test-pipeline-run",
        namespace: "edp",
        labels: {
          "tekton.dev/pipeline": "test-build-pipeline",
          "app.edp.epam.com/codebase": "test-codebase",
        },
        annotations: {
          "app.edp.epam.com/queue-cancel-reason": "user-cancelled",
          "argocd.argoproj.io/compare-options": "IgnoreExtraneous",
        },
      },
      spec: {
        pipelineRef: { name: "test-build-pipeline" },
      },
    } as unknown as PipelineRun;

    createRerunPipelineRun(original);

    expect(original.metadata.labels).toEqual({
      "tekton.dev/pipeline": "test-build-pipeline",
      "app.edp.epam.com/codebase": "test-codebase",
    });
    expect(original.metadata.annotations).toEqual({
      "app.edp.epam.com/queue-cancel-reason": "user-cancelled",
      "argocd.argoproj.io/compare-options": "IgnoreExtraneous",
    });
  });
});
