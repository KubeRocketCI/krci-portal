import { agentReviewRunsSchema, type AgentReviewRuns } from "@my-project/shared";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { getAgentReviewRuns } from "../../fleet/index.js";
import { agentRefSchema } from "../getAgent/index.js";

/** The agent and the review run history are read with the portal ServiceAccount; its Codebase and the live review runs with the user's `idToken`. */
export const getAgentReviewRunsProcedure = protectedProcedure
  .input(agentRefSchema)
  .output(agentReviewRunsSchema)
  .query(({ ctx, input }): Promise<AgentReviewRuns> => getAgentReviewRuns(ctx, input));
