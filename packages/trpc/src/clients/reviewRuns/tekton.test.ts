import {
  K8sApiError,
  k8sPipelineRunConfig,
  validateCELFilter,
  type K8sResourceConfig,
  type PipelineRun,
  type TektonResult,
  type TektonResultStatus,
  type TektonResultsQueryParams,
} from "@my-project/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockSession } from "../../__mocks__/session.js";
import type { CustomSession } from "../../context/types.js";
import { notConfiguredError } from "../http/index.js";
import type { K8sClient } from "../k8s/index.js";
import type { TektonResultsClient } from "../tektonResults/index.js";
import { TektonReviewRunSource } from "./tekton.js";

const NAMESPACE = "krci";
const CODEBASE = { name: "test-go-app", namespace: NAMESPACE };
const ISSUE_BRANCH = "agent/issue-32";
const MR_URL = "https://gitlab.example.com/krci/test-go-app/-/merge_requests/5";
const QUERY = { codebase: CODEBASE, issueBranch: ISSUE_BRANCH };
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
}

const gitAnnotationsOf = (fields: RunFields) => ({
  "app.edp.epam.com/git-branch": fields.branch ?? ISSUE_BRANCH,
  "app.edp.epam.com/git-target-branch": fields.targetBranch ?? "main",
  "app.edp.epam.com/git-change-number": fields.change ?? "5",
  "app.edp.epam.com/git-change-url": fields.url ?? MR_URL,
  "app.edp.epam.com/git-commit-sha": fields.commit ?? "4f1c2e9d0b7a3c5e",
});

function pipelineRun(
  name: string,
  fields: RunFields & { succeeded?: { status: string; reason: string } }
): PipelineRun {
  return {
    apiVersion: "tekton.dev/v1",
    kind: "PipelineRun",
    metadata: {
      name,
      namespace: NAMESPACE,
      creationTimestamp: fields.created,
      labels: {
        "app.edp.epam.com/codebase": fields.codebase ?? CODEBASE.name,
        "app.edp.epam.com/pipelinetype": fields.pipelineType ?? "review",
      },
      annotations: { "results.tekton.dev/resultAnnotations": JSON.stringify(gitAnnotationsOf(fields)) },
    },
    spec: { pipelineRef: { name: "gitlab-go-review" } },
    status: {
      startTime: fields.start,
      completionTime: fields.completion,
      conditions: fields.succeeded ? [{ type: "Succeeded", ...fields.succeeded }] : [],
    },
  } as unknown as PipelineRun;
}

/** No `status`: Tekton Results stores no status for a running run. */
function historyResult(name: string, fields: RunFields & { status?: TektonResultStatus }): TektonResult {
  return {
    uid: `uid-${name}`,
    name: `${NAMESPACE}/results/uid-${name}`,
    create_time: fields.created,
    update_time: fields.completion ?? fields.created,
    summary: {
      record: `${NAMESPACE}/results/uid-${name}/records/rec-${name}`,
      type: "tekton.dev/v1.PipelineRun",
      ...(fields.status && { status: fields.status }),
      start_time: fields.start,
      end_time: fields.completion,
    },
    annotations: {
      "object.metadata.name": name,
      "tekton.dev/pipeline": "gitlab-go-review",
      "app.edp.epam.com/codebase": fields.codebase ?? CODEBASE.name,
      "app.edp.epam.com/pipelinetype": fields.pipelineType ?? "review",
      ...gitAnnotationsOf(fields),
    },
  } as TektonResult;
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

const ANNOTATION_CLAUSE = /annotations\["([^"]+)"\] == '([^']*)'/g;

/** Applies the annotation equality clauses of the filter; ignores every other clause. */
function fakeHistoryClient(results: TektonResult[] | Error) {
  const listResults = vi.fn(async (params?: TektonResultsQueryParams) => {
    if (results instanceof Error) throw results;
    const clauses = [...(params?.filter ?? "").matchAll(ANNOTATION_CLAUSE)];
    return {
      results: results.filter((result) => clauses.every(([, key, value]) => result.annotations?.[key] === value)),
      next_page_token: "",
    };
  });
  const historyClientOf = vi.fn(() => ({ listResults }) as unknown as TektonResultsClient);
  return { listResults, historyClientOf };
}

function sourceOf(live: PipelineRun[], history: TektonResult[] | Error = []) {
  const k8s = fakeK8sClient(live);
  const tektonResults = fakeHistoryClient(history);
  return {
    source: new TektonReviewRunSource(k8s.k8sClientOf, tektonResults.historyClientOf),
    ...k8s,
    ...tektonResults,
  };
}

const SUCCEEDED = { status: "True", reason: "Succeeded" };
const FAILED = { status: "False", reason: "Failed" };
const RUNNING = { status: "Unknown", reason: "Running" };

describe("TektonReviewRunSource", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads review PipelineRuns of the Codebase with the session and selects on Codebase and pipeline type", async () => {
    const { source, listAllResources, k8sClientOf } = sourceOf([]);

    await source.listReviewRuns(session, QUERY);

    expect(k8sClientOf).toHaveBeenCalledWith(session);
    expect(listAllResources).toHaveBeenCalledWith(
      k8sPipelineRunConfig,
      NAMESPACE,
      "app.edp.epam.com/codebase=test-go-app,app.edp.epam.com/pipelinetype=review"
    );
  });

  it("reads the newest 50 review runs of the issue branch in the Codebase from Tekton Results in the Codebase namespace", async () => {
    const { source, listResults, historyClientOf } = sourceOf([]);

    await source.listReviewRuns(session, QUERY);

    expect(historyClientOf).toHaveBeenCalledWith(NAMESPACE);
    expect(listResults).toHaveBeenCalledWith({
      filter:
        "summary.type == 'tekton.dev/v1.PipelineRun'" +
        " && annotations[\"app.edp.epam.com/codebase\"] == 'test-go-app'" +
        " && annotations[\"app.edp.epam.com/pipelinetype\"] == 'review'" +
        " && annotations[\"app.edp.epam.com/git-branch\"] == 'agent/issue-32'",
      pageSize: 50,
      orderBy: "create_time desc",
    });
    expect(validateCELFilter(listResults.mock.calls[0][0]?.filter ?? "")).toEqual({ valid: true });
  });

  it("reads the review runs of the Codebase with no branch clause, and keeps the issue branch, for a branch name unsafe in CEL", async () => {
    const issueBranch = "agent/it's-32";
    const { source, listResults } = sourceOf(
      [],
      [
        historyResult("review-quoted", { created: "2026-11-24T10:00:00Z", status: "SUCCESS", branch: issueBranch }),
        historyResult("review-other", { created: "2026-11-24T10:01:00Z", status: "SUCCESS", change: "9" }),
      ]
    );

    const { history, mergeRequests } = await source.listReviewRuns(session, { codebase: CODEBASE, issueBranch });

    const filter = listResults.mock.calls[0][0]?.filter ?? "";
    expect(filter).not.toContain("git-branch");
    expect(validateCELFilter(filter)).toEqual({ valid: true });
    expect(history).toBe("ready");
    expect(mergeRequests.flatMap(({ reviewRuns }) => reviewRuns.map(({ name }) => name))).toEqual(["review-quoted"]);
  });

  it("gives one merge request with its finished live review runs, newest first", async () => {
    const { source } = sourceOf([
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

    expect(await source.listReviewRuns(session, QUERY)).toEqual({
      history: "ready",
      mergeRequests: [
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
      ],
    });
  });

  it("gives the merge request and its finished runs from history when the live PipelineRuns are deleted", async () => {
    const { source } = sourceOf(
      [],
      [
        historyResult("review-h2", {
          created: "2026-11-24T11:00:00Z",
          start: "2026-11-24T11:00:02Z",
          completion: "2026-11-24T11:03:02Z",
          status: "SUCCESS",
          targetBranch: "develop",
          commit: "bbbbbbb2222",
        }),
        historyResult("review-h1", {
          created: "2026-11-24T10:00:00Z",
          start: "2026-11-24T10:00:05Z",
          completion: "2026-11-24T10:04:35Z",
          status: "FAILURE",
        }),
      ]
    );

    expect(await source.listReviewRuns(session, QUERY)).toEqual({
      history: "ready",
      mergeRequests: [
        {
          number: "5",
          url: MR_URL,
          sourceBranch: ISSUE_BRANCH,
          targetBranch: "develop",
          title: null,
          state: null,
          draft: null,
          reviewRuns: [
            {
              name: "review-h2",
              namespace: NAMESPACE,
              status: { phase: "succeeded", reason: "succeeded" },
              startedAt: "2026-11-24T11:00:02Z",
              durationMs: 180_000,
              commit: "bbbbbbb2222",
              origin: "history",
            },
            {
              name: "review-h1",
              namespace: NAMESPACE,
              status: { phase: "failed", reason: "failed" },
              startedAt: "2026-11-24T10:00:05Z",
              durationMs: 270_000,
              commit: "4f1c2e9d0b7a3c5e",
              origin: "history",
            },
          ],
        },
      ],
    });
  });

  it("gives a live run in place of the history run with the same name, together with the older history runs", async () => {
    const { source } = sourceOf(
      [
        pipelineRun("review-b", {
          created: "2026-11-24T11:00:00Z",
          start: "2026-11-24T11:00:02Z",
          completion: "2026-11-24T11:03:02Z",
          succeeded: SUCCEEDED,
        }),
      ],
      [
        historyResult("review-b", {
          created: "2026-11-24T11:00:00Z",
          start: "2026-11-24T11:00:02Z",
          completion: "2026-11-24T11:03:02Z",
          status: "SUCCESS",
        }),
        historyResult("review-a", { created: "2026-11-24T10:00:00Z", status: "FAILURE" }),
      ]
    );

    const { mergeRequests } = await source.listReviewRuns(session, QUERY);

    expect(mergeRequests).toHaveLength(1);
    expect(mergeRequests[0].reviewRuns.map(({ name, origin }) => [name, origin])).toEqual([
      ["review-b", "live"],
      ["review-a", "history"],
    ]);
  });

  it("gives the live status of a running run that history holds with no status", async () => {
    const { source } = sourceOf(
      [
        pipelineRun("review-running", {
          created: "2026-11-24T12:00:00Z",
          start: "2026-11-24T12:00:03Z",
          succeeded: RUNNING,
        }),
      ],
      [historyResult("review-running", { created: "2026-11-24T12:00:00Z", start: "2026-11-24T12:00:03Z" })]
    );

    const { mergeRequests } = await source.listReviewRuns(session, QUERY);

    expect(mergeRequests[0].reviewRuns).toEqual([
      expect.objectContaining({
        name: "review-running",
        status: { phase: "in-progress", reason: "running" },
        startedAt: "2026-11-24T12:00:03Z",
        durationMs: null,
        origin: "live",
      }),
    ]);
  });

  it("drops a history result that carries no PipelineRun name, so it does not stand beside its live run", async () => {
    const unnamed = historyResult("review-running", { created: "2026-11-24T12:00:00Z" });
    delete unnamed.annotations?.["object.metadata.name"];
    const { source } = sourceOf(
      [pipelineRun("review-running", { created: "2026-11-24T12:00:00Z", succeeded: RUNNING })],
      [unnamed]
    );

    const { mergeRequests } = await source.listReviewRuns(session, QUERY);

    expect(mergeRequests[0].reviewRuns.map(({ name, origin }) => [name, origin])).toEqual([["review-running", "live"]]);
  });

  it("orders runs created in the same second live first, then by name", async () => {
    const created = "2026-11-24T12:00:00Z";
    const { source } = sourceOf(
      [pipelineRun("review-d", { created }), pipelineRun("review-c", { created })],
      [
        historyResult("review-b", { created, status: "SUCCESS" }),
        historyResult("review-a", { created, status: "SUCCESS" }),
      ]
    );

    const { mergeRequests } = await source.listReviewRuns(session, QUERY);

    expect(mergeRequests[0].reviewRuns.map(({ name }) => name)).toEqual([
      "review-c",
      "review-d",
      "review-a",
      "review-b",
    ]);
  });

  it("gives an unknown status for a history run with no status and no live PipelineRun", async () => {
    const { source } = sourceOf([], [historyResult("review-lost", { created: "2026-11-24T12:00:00Z" })]);

    const { mergeRequests } = await source.listReviewRuns(session, QUERY);

    expect(mergeRequests[0].reviewRuns).toEqual([
      expect.objectContaining({
        name: "review-lost",
        status: { phase: "unknown", reason: undefined },
        origin: "history",
      }),
    ]);
  });

  it("gives a running review run with no duration, and a queued one with no start", async () => {
    const { source } = sourceOf([
      pipelineRun("review-running", {
        created: "2026-11-24T12:00:00Z",
        start: "2026-11-24T12:00:03Z",
        succeeded: RUNNING,
      }),
      pipelineRun("review-queued", { created: "2026-11-24T12:05:00Z" }),
    ]);

    const { mergeRequests } = await source.listReviewRuns(session, QUERY);

    expect(mergeRequests[0].reviewRuns).toEqual([
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

  it("keeps only the live and history runs whose git branch is the issue branch", async () => {
    const { source } = sourceOf(
      [
        pipelineRun("review-issue-32", { created: "2026-11-24T10:00:00Z" }),
        pipelineRun("review-issue-320", { created: "2026-11-24T10:01:00Z", branch: "agent/issue-320", change: "9" }),
      ],
      [
        historyResult("review-issue-32-old", { created: "2026-11-24T09:00:00Z", status: "SUCCESS" }),
        historyResult("review-main", { created: "2026-11-24T10:02:00Z", branch: "main", change: "10" }),
      ]
    );

    const { mergeRequests } = await source.listReviewRuns(session, QUERY);

    expect(mergeRequests.map(({ number }) => number)).toEqual(["5"]);
    expect(mergeRequests[0].reviewRuns.map(({ name }) => name)).toEqual(["review-issue-32", "review-issue-32-old"]);
  });

  it("groups the runs by the merge request number of the annotations, newest merge request first", async () => {
    const otherUrl = "https://gitlab.example.com/krci/test-go-app/-/merge_requests/7";
    const { source } = sourceOf(
      [
        pipelineRun("review-mr5-b", { created: "2026-11-24T12:00:00Z" }),
        pipelineRun("review-no-change", { created: "2026-11-24T13:00:00Z", change: "" }),
      ],
      [
        historyResult("review-mr5-a", { created: "2026-11-24T10:00:00Z", status: "SUCCESS" }),
        historyResult("review-mr7-a", {
          created: "2026-11-24T11:00:00Z",
          status: "SUCCESS",
          change: "7",
          url: otherUrl,
        }),
      ]
    );

    const { mergeRequests } = await source.listReviewRuns(session, QUERY);

    expect(
      mergeRequests.map(({ number, url, reviewRuns }) => [number, url, reviewRuns.map(({ name }) => name)])
    ).toEqual([
      ["5", MR_URL, ["review-mr5-b", "review-mr5-a"]],
      ["7", otherUrl, ["review-mr7-a"]],
    ]);
  });

  it("gives only the live and history runs of the Codebase when two Codebases have the same branch name", async () => {
    const { source } = sourceOf(
      [
        pipelineRun("review-go", { created: "2026-11-24T10:00:00Z" }),
        pipelineRun("review-other", { created: "2026-11-24T10:01:00Z", codebase: "other-app" }),
      ],
      [
        historyResult("review-go-old", { created: "2026-11-24T09:00:00Z", status: "SUCCESS" }),
        historyResult("review-other-old", {
          created: "2026-11-24T09:01:00Z",
          status: "SUCCESS",
          codebase: "other-app",
        }),
        historyResult("build-go-old", { created: "2026-11-24T09:02:00Z", status: "SUCCESS", pipelineType: "build" }),
      ]
    );

    const { mergeRequests } = await source.listReviewRuns(session, QUERY);

    expect(mergeRequests.flatMap(({ reviewRuns }) => reviewRuns.map(({ name }) => name))).toEqual([
      "review-go",
      "review-go-old",
    ]);
  });

  it("gives no link and no commit for values that the annotations do not name or that are not http(s) URLs", async () => {
    const { source } = sourceOf([
      pipelineRun("review-a", { created: "2026-11-24T10:00:00Z", url: "javascript:alert(1)", commit: "" }),
    ]);

    const { mergeRequests } = await source.listReviewRuns(session, QUERY);

    expect(mergeRequests[0].url).toBeNull();
    expect(mergeRequests[0].reviewRuns[0].commit).toBeNull();
  });

  it("gives the live runs and history unreachable, and logs the error, when the Tekton Results read fails", async () => {
    const { source } = sourceOf(
      [pipelineRun("review-a", { created: "2026-11-24T10:00:00Z", succeeded: SUCCEEDED })],
      new Error("connection refused")
    );

    const { history, mergeRequests } = await source.listReviewRuns(session, QUERY);

    expect(history).toBe("unreachable");
    expect(mergeRequests.flatMap(({ reviewRuns }) => reviewRuns.map(({ name }) => name))).toEqual(["review-a"]);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("connection refused"));
  });

  it("logs a failed history read of a Codebase at most once a minute", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-24T12:00:00Z"));
    try {
      const { source } = sourceOf([], new Error("connection refused"));

      await source.listReviewRuns(session, QUERY);
      vi.setSystemTime(new Date("2026-11-24T12:00:59Z"));
      await source.listReviewRuns(session, QUERY);
      expect(console.error).toHaveBeenCalledTimes(1);

      vi.setSystemTime(new Date("2026-11-24T12:01:00Z"));
      await source.listReviewRuns(session, QUERY);
      expect(console.error).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("gives the live runs and history notConfigured, with no log, when Tekton Results is not configured", async () => {
    const { k8sClientOf } = fakeK8sClient([pipelineRun("review-a", { created: "2026-11-24T10:00:00Z" })]);
    const source = new TektonReviewRunSource(k8sClientOf, () => {
      throw notConfiguredError("Tekton Results", "TEKTON_RESULTS_URL");
    });

    const { history, mergeRequests } = await source.listReviewRuns(session, QUERY);

    expect(history).toBe("notConfigured");
    expect(mergeRequests).toHaveLength(1);
    expect(console.error).not.toHaveBeenCalled();
  });

  it("rejects when the PipelineRun list fails, also when the history read fails", async () => {
    const listAllResources = vi.fn().mockRejectedValue(new K8sApiError(403, "Forbidden", ""));
    const { historyClientOf } = fakeHistoryClient(new Error("Tekton Results unreachable"));
    const source = new TektonReviewRunSource(() => ({ listAllResources }) as unknown as K8sClient, historyClientOf);

    await expect(source.listReviewRuns(session, QUERY)).rejects.toThrow(K8sApiError);
  });

  it("sends no Tekton Results query when the PipelineRun list is refused", async () => {
    const listAllResources = vi.fn().mockRejectedValue(new K8sApiError(403, "Forbidden", ""));
    const { listResults, historyClientOf } = fakeHistoryClient([]);
    const source = new TektonReviewRunSource(() => ({ listAllResources }) as unknown as K8sClient, historyClientOf);

    await expect(source.listReviewRuns(session, QUERY)).rejects.toThrow(K8sApiError);
    expect(historyClientOf).not.toHaveBeenCalled();
    expect(listResults).not.toHaveBeenCalled();
  });
});
