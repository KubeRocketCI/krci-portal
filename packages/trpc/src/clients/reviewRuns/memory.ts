import type { CodebaseRef, MergeRequest } from "@my-project/shared";
import type { ReviewRunQuery, ReviewRunSource } from "./source.js";

export interface MemoryMergeRequest {
  codebase: CodebaseRef;
  mergeRequest: MergeRequest;
}

export class MemoryReviewRunSource implements ReviewRunSource {
  private mergeRequests: MemoryMergeRequest[];
  private error: Error | null = null;

  constructor(mergeRequests: MemoryMergeRequest[] = []) {
    this.mergeRequests = structuredClone(mergeRequests);
  }

  failWith(error: Error | null): void {
    this.error = error;
  }

  async listMergeRequests(_session: unknown, { codebase, issueBranch }: ReviewRunQuery): Promise<MergeRequest[]> {
    if (this.error) throw this.error;
    return structuredClone(
      this.mergeRequests
        .filter(
          (held) =>
            held.codebase.name === codebase.name &&
            held.codebase.namespace === codebase.namespace &&
            held.mergeRequest.sourceBranch === issueBranch
        )
        .map(({ mergeRequest }) => mergeRequest)
    );
  }
}
