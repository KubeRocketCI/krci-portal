import type { CodebaseRef, MergeRequest } from "@my-project/shared";
import type { CustomSession } from "../../context/types.js";

export interface ReviewRunQuery {
  codebase: CodebaseRef;
  issueBranch: string;
}

/** Reads with the session `idToken`. Rejects when the read fails. */
export interface ReviewRunSource {
  listMergeRequests(session: CustomSession, query: ReviewRunQuery): Promise<MergeRequest[]>;
}
