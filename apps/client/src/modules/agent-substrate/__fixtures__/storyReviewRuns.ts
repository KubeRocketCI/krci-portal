import type { AgentReviewRuns, MergeRequest, ReviewRun, ReviewRunOrigin } from "@my-project/shared";
import { REVIEW_RUN_ICON_COUNT } from "../pages/agents/detail/components/AgentProducedCard";

// The review runs of issue-2-32 (go agent profile): the running run is a testbed capture, the others are simulated.

const PLATFORM_NAMESPACE = "krci";
const MR_URL = "https://gitlab.example.com/krci/test-go-app/-/merge_requests/5";

function finishedRun(index: number, phase: "succeeded" | "failed", origin: ReviewRunOrigin = "live"): ReviewRun {
  const hour = String(8 + index).padStart(2, "0");
  return {
    name: `test-go-app-review-f${index}`,
    namespace: PLATFORM_NAMESPACE,
    status: { phase, reason: phase },
    startedAt: `2026-11-24T${hour}:00:05Z`,
    durationMs: 180_000 + index * 15_000,
    commit: `${index}f1c2e9d0b7a3c5e8a1d4b6f9e2c7a0d3b5e8f1c`,
    origin,
  };
}

export const RUNNING_REVIEW_RUN: ReviewRun = {
  name: "test-go-app-review-x7k2p",
  namespace: PLATFORM_NAMESPACE,
  status: { phase: "in-progress", reason: "running" },
  startedAt: "2026-11-24T18:10:03Z",
  durationMs: null,
  commit: "9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b",
  origin: "live",
};

function mergeRequest(reviewRuns: ReviewRun[]): MergeRequest {
  return {
    number: "5",
    url: MR_URL,
    sourceBranch: "agent/issue-32",
    targetBranch: "main",
    title: null,
    state: null,
    draft: null,
    reviewRuns,
  };
}

export const NO_REVIEW_RUN: AgentReviewRuns = { mergeRequests: [], history: "ready" };

export const RUNNING_REVIEW_RUNS: AgentReviewRuns = {
  mergeRequests: [mergeRequest([RUNNING_REVIEW_RUN, finishedRun(2, "failed"), finishedRun(1, "succeeded")])],
  history: "ready",
};

export const FINISHED_REVIEW_RUNS: AgentReviewRuns = {
  mergeRequests: [mergeRequest([finishedRun(2, "succeeded"), finishedRun(1, "failed")])],
  history: "ready",
};

/** The live PipelineRuns of the finished runs are deleted; Tekton Results holds them. */
export const HISTORY_REVIEW_RUNS: AgentReviewRuns = {
  mergeRequests: [
    mergeRequest([RUNNING_REVIEW_RUN, finishedRun(2, "failed", "history"), finishedRun(1, "succeeded", "history")]),
  ],
  history: "ready",
};

/** The Tekton Results read failed: the live running run only. */
export const HISTORY_UNREACHABLE_REVIEW_RUNS: AgentReviewRuns = {
  mergeRequests: [mergeRequest([RUNNING_REVIEW_RUN])],
  history: "unreachable",
};

/** No Tekton Results in the deployment: the live running run only. */
export const HISTORY_NOT_CONFIGURED_REVIEW_RUNS: AgentReviewRuns = {
  mergeRequests: [mergeRequest([RUNNING_REVIEW_RUN])],
  history: "notConfigured",
};

export const EXTRA_REVIEW_RUNS = 3;

const MANY_REVIEW_RUN_COUNT = REVIEW_RUN_ICON_COUNT + EXTRA_REVIEW_RUNS;

/** Finished runs, newest first. */
export const MANY_REVIEW_RUNS: AgentReviewRuns = {
  mergeRequests: [
    mergeRequest(
      Array.from({ length: MANY_REVIEW_RUN_COUNT }, (_, i) => MANY_REVIEW_RUN_COUNT - i).map((index) =>
        finishedRun(index, index % 3 === 0 ? "failed" : "succeeded")
      )
    ),
  ],
  history: "ready",
};
