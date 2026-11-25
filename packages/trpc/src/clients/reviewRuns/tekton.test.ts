import { K8sApiError, k8sPipelineRunConfig, type K8sResourceConfig, type PipelineRun } from "@my-project/shared";
import { describe, expect, it, vi } from "vitest";
import { mockSession } from "../../__mocks__/session.js";
import type { CustomSession } from "../../context/types.js";
import type { K8sClient } from "../k8s/index.js";
import { TektonReviewRunSource } from "./tekton.js";

const NAMESPACE = "krci";
const CODEBASE = { name: "test-go-app", namespace: NAMESPACE };
const ISSUE_BRANCH = "agent/issue-32";
const MR_URL = "https://gitlab.example.com/krci/test-go-app/-/merge_requests/5";
const session = mockSession as unknown as CustomSession;

interface RunFields {
  codebase?: string;
  pipelineType?: string;
  branch?: string;
  targetBranch?: string;
  change?: string;
  url?: string;
  commit?: string;
  created: string;
  start?: string;
  completion?: string;
  succeeded?: { status: string; reason: string };
}

function pipelineRun(name: string, fields: RunFields): PipelineRun {
  const {
    codebase = CODEBASE.name,
    pipelineType = "review",
    branch = ISSUE_BRANCH,
    targetBranch = "main",
    change = "5",
    url = MR_URL,
    commit = "4f1c2e9d0b7a3c5e",
  } = fields;
  return {
    apiVersion: "tekton.dev/v1",
    kind: "PipelineRun",
    metadata: {
      name,
      namespace: NAMESPACE,
      creationTimestamp: fields.created,
      labels: {
        "app.edp.epam.com/codebase": codebase,
        "app.edp.epam.com/pipelinetype": pipelineType,
      },
      annotations: {
        "results.tekton.dev/resultAnnotations": JSON.stringify({
          "app.edp.epam.com/git-branch": branch,
          "app.edp.epam.com/git-target-branch": targetBranch,
          "app.edp.epam.com/git-change-number": change,
          "app.edp.epam.com/git-change-url": url,
          "app.edp.epam.com/git-commit-sha": commit,
        }),
      },
    },
    spec: { pipelineRef: { name: "gitlab-go-review" } },
    status: {
      startTime: fields.start,
      completionTime: fields.completion,
      conditions: fields.succeeded ? [{ type: "Succeeded", ...fields.succeeded }] : [],
    },
  } as unknown as PipelineRun;
}

function fakeK8sClient(pipelineRuns: PipelineRun[]) {
  const listAllResources = vi.fn(async (config: K8sResourceConfig, namespace?: string, labelSelector?: string) => {
    if (config !== k8sPipelineRunConfig) throw new K8sApiError(404, "Not Found", "");
    const wanted = (labelSelector ?? "").split(",").map((term) => term.split("="));
    return {
      items: pipelineRuns.filter(
        (run) =>
          run.metadata.namespace === namespace && wanted.every(([key, value]) => run.metadata.labels?.[key] === value)
      ),
    };
  });
  const k8sClientOf = vi.fn(() => ({ listAllResources }) as unknown as K8sClient);
  return { listAllResources, k8sClientOf };
}

const SUCCEEDED = { status: "True", reason: "Succeeded" };
const FAILED = { status: "False", reason: "Failed" };
const RUNNING = { status: "Unknown", reason: "Running" };

describe("TektonReviewRunSource", () => {
  it("reads review PipelineRuns of the Codebase with the session and selects on Codebase and pipeline type", async () => {
    const { listAllResources, k8sClientOf } = fakeK8sClient([]);

    await new TektonReviewRunSource(k8sClientOf).listMergeRequests(session, {
      codebase: CODEBASE,
      issueBranch: ISSUE_BRANCH,
    });

    expect(k8sClientOf).toHaveBeenCalledWith(session);
    expect(listAllResources).toHaveBeenCalledWith(
      k8sPipelineRunConfig,
      NAMESPACE,
      "app.edp.epam.com/codebase=test-go-app,app.edp.epam.com/pipelinetype=review"
    );
  });

  it("gives one merge request with its finished review runs, newest first", async () => {
    const { k8sClientOf } = fakeK8sClient([
      pipelineRun("review-a", {
        created: "2026-11-24T10:00:00Z",
        start: "2026-11-24T10:00:05Z",
        completion: "2026-11-24T10:04:35Z",
        succeeded: FAILED,
        commit: "aaaaaaa1111",
      }),
      pipelineRun("review-b", {
        created: "2026-11-24T11:00:00Z",
        start: "2026-11-24T11:00:02Z",
        completion: "2026-11-24T11:03:02Z",
        succeeded: SUCCEEDED,
        commit: "bbbbbbb2222",
      }),
    ]);

    const mergeRequests = await new TektonReviewRunSource(k8sClientOf).listMergeRequests(session, {
      codebase: CODEBASE,
      issueBranch: ISSUE_BRANCH,
    });

    expect(mergeRequests).toEqual([
      {
        number: "5",
        url: MR_URL,
        sourceBranch: ISSUE_BRANCH,
        targetBranch: "main",
        title: null,
        state: null,
        draft: null,
        reviewRuns: [
          {
            name: "review-b",
            namespace: NAMESPACE,
            status: { phase: "succeeded", reason: "succeeded" },
            startedAt: "2026-11-24T11:00:02Z",
            durationMs: 180_000,
            commit: "bbbbbbb2222",
            origin: "live",
          },
          {
            name: "review-a",
            namespace: NAMESPACE,
            status: { phase: "failed", reason: "failed" },
            startedAt: "2026-11-24T10:00:05Z",
            durationMs: 270_000,
            commit: "aaaaaaa1111",
            origin: "live",
          },
        ],
      },
    ]);
  });

  it("gives a running review run with no duration, and a queued one with no start", async () => {
    const { k8sClientOf } = fakeK8sClient([
      pipelineRun("review-running", {
        created: "2026-11-24T12:00:00Z",
        start: "2026-11-24T12:00:03Z",
        succeeded: RUNNING,
      }),
      pipelineRun("review-queued", { created: "2026-11-24T12:05:00Z" }),
    ]);

    const [mergeRequest] = await new TektonReviewRunSource(k8sClientOf).listMergeRequests(session, {
      codebase: CODEBASE,
      issueBranch: ISSUE_BRANCH,
    });

    expect(mergeRequest.reviewRuns).toEqual([
      expect.objectContaining({
        name: "review-queued",
        status: { phase: "in-progress", reason: undefined },
        startedAt: null,
        durationMs: null,
      }),
      expect.objectContaining({
        name: "review-running",
        status: { phase: "in-progress", reason: "running" },
        startedAt: "2026-11-24T12:00:03Z",
        durationMs: null,
      }),
    ]);
  });

  it("keeps only the runs whose git branch is the issue branch", async () => {
    const { k8sClientOf } = fakeK8sClient([
      pipelineRun("review-issue-32", { created: "2026-11-24T10:00:00Z" }),
      pipelineRun("review-issue-320", { created: "2026-11-24T10:01:00Z", branch: "agent/issue-320", change: "9" }),
      pipelineRun("review-main", { created: "2026-11-24T10:02:00Z", branch: "main", change: "10" }),
    ]);

    const mergeRequests = await new TektonReviewRunSource(k8sClientOf).listMergeRequests(session, {
      codebase: CODEBASE,
      issueBranch: ISSUE_BRANCH,
    });

    expect(mergeRequests.map(({ number }) => number)).toEqual(["5"]);
    expect(mergeRequests[0].reviewRuns.map(({ name }) => name)).toEqual(["review-issue-32"]);
  });

  it("groups the runs by the merge request number of the annotations, newest merge request first", async () => {
    const otherUrl = "https://gitlab.example.com/krci/test-go-app/-/merge_requests/7";
    const { k8sClientOf } = fakeK8sClient([
      pipelineRun("review-mr5-a", { created: "2026-11-24T10:00:00Z" }),
      pipelineRun("review-mr7-a", { created: "2026-11-24T11:00:00Z", change: "7", url: otherUrl }),
      pipelineRun("review-mr5-b", { created: "2026-11-24T12:00:00Z" }),
      pipelineRun("review-no-change", { created: "2026-11-24T13:00:00Z", change: "" }),
    ]);

    const mergeRequests = await new TektonReviewRunSource(k8sClientOf).listMergeRequests(session, {
      codebase: CODEBASE,
      issueBranch: ISSUE_BRANCH,
    });

    expect(
      mergeRequests.map(({ number, url, reviewRuns }) => [number, url, reviewRuns.map(({ name }) => name)])
    ).toEqual([
      ["5", MR_URL, ["review-mr5-b", "review-mr5-a"]],
      ["7", otherUrl, ["review-mr7-a"]],
    ]);
  });

  it("gives only the runs of the Codebase when two Codebases have the same branch name", async () => {
    const { k8sClientOf } = fakeK8sClient([
      pipelineRun("review-go", { created: "2026-11-24T10:00:00Z" }),
      pipelineRun("review-other", { created: "2026-11-24T10:01:00Z", codebase: "other-app" }),
    ]);

    const mergeRequests = await new TektonReviewRunSource(k8sClientOf).listMergeRequests(session, {
      codebase: CODEBASE,
      issueBranch: ISSUE_BRANCH,
    });

    expect(mergeRequests.flatMap(({ reviewRuns }) => reviewRuns.map(({ name }) => name))).toEqual(["review-go"]);
  });

  it("gives no link and no commit for values that the annotations do not name or that are not http(s) URLs", async () => {
    const { k8sClientOf } = fakeK8sClient([
      pipelineRun("review-a", { created: "2026-11-24T10:00:00Z", url: "javascript:alert(1)", commit: "" }),
    ]);

    const [mergeRequest] = await new TektonReviewRunSource(k8sClientOf).listMergeRequests(session, {
      codebase: CODEBASE,
      issueBranch: ISSUE_BRANCH,
    });

    expect(mergeRequest.url).toBeNull();
    expect(mergeRequest.reviewRuns[0].commit).toBeNull();
  });

  it("rejects when the PipelineRun list fails", async () => {
    const listAllResources = vi.fn().mockRejectedValue(new K8sApiError(403, "Forbidden", ""));
    const source = new TektonReviewRunSource(() => ({ listAllResources }) as unknown as K8sClient);

    await expect(source.listMergeRequests(session, { codebase: CODEBASE, issueBranch: ISSUE_BRANCH })).rejects.toThrow(
      K8sApiError
    );
  });
});
