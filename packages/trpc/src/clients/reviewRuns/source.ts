import type { AgentReviewRuns, CodebaseRef } from "@my-project/shared";
import type { CustomSession } from "../../context/types.js";

export interface ReviewRunQuery {
  codebase: CodebaseRef;
  issueBranch: string;
}

/** Reads live runs with the session `idToken`. Rejects when the live read fails; a failed history read gives `history: "unreachable"`. */
export interface ReviewRunSource {
  listReviewRuns(session: CustomSession, query: ReviewRunQuery): Promise<AgentReviewRuns>;
}
