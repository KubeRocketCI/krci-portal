import type { AgentReviewRuns, MergeRequest, ReviewRun } from "@my-project/shared";
import { REVIEW_RUN_ICON_COUNT } from "../pages/agents/detail/components/AgentProducedCard";

// The review runs of issue-2-32 (go agent profile): the running run is a testbed capture, the others are simulated.

const PLATFORM_NAMESPACE = "krci";
const MR_URL = "https://gitlab.example.com/krci/test-go-app/-/merge_requests/5";

function finishedRun(index: number, phase: "succeeded" | "failed"): ReviewRun {
  const hour = String(8 + index).padStart(2, "0");
  return {
    name: `test-go-app-review-f${index}`,
    namespace: PLATFORM_NAMESPACE,
    status: { phase, reason: phase },
    startedAt: `2026-11-24T${hour}:00:05Z`,
    durationMs: 180_000 + index * 15_000,
    commit: `${index}f1c2e9d0b7a3c5e8a1d4b6f9e2c7a0d3b5e8f1c`,
    origin: "live",
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

export const NO_REVIEW_RUN: AgentReviewRuns = { mergeRequests: [] };

export const RUNNING_REVIEW_RUNS: AgentReviewRuns = {
  mergeRequests: [mergeRequest([RUNNING_REVIEW_RUN, finishedRun(2, "failed"), finishedRun(1, "succeeded")])],
};

export const FINISHED_REVIEW_RUNS: AgentReviewRuns = {
  mergeRequests: [mergeRequest([finishedRun(2, "succeeded"), finishedRun(1, "failed")])],
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
};
