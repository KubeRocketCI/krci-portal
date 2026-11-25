import type { AgentReviewRuns, CodebaseRef, MergeRequest, ReviewRunHistory } from "@my-project/shared";
import type { ReviewRunQuery, ReviewRunSource } from "./source.js";

export interface MemoryMergeRequest {
  codebase: CodebaseRef;
  mergeRequest: MergeRequest;
}

export class MemoryReviewRunSource implements ReviewRunSource {
  private mergeRequests: MemoryMergeRequest[];
  private error: Error | null = null;
  private history: ReviewRunHistory = "ready";

  constructor(mergeRequests: MemoryMergeRequest[] = []) {
    this.mergeRequests = structuredClone(mergeRequests);
  }

  failWith(error: Error | null): void {
    this.error = error;
  }

  /** `notConfigured` and `unreachable`: the held merge requests stand for the live runs only. */
  setHistory(history: ReviewRunHistory): void {
    this.history = history;
  }

  async listReviewRuns(_session: unknown, { codebase, issueBranch }: ReviewRunQuery): Promise<AgentReviewRuns> {
    if (this.error) throw this.error;
    return {
      mergeRequests: structuredClone(
        this.mergeRequests
          .filter(
            (held) =>
              held.codebase.name === codebase.name &&
              held.codebase.namespace === codebase.namespace &&
              held.mergeRequest.sourceBranch === issueBranch
          )
          .map(({ mergeRequest }) => mergeRequest)
      ),
      history: this.history,
    };
  }
}
