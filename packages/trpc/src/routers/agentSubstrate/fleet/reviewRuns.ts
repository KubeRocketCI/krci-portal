import { TRPCError } from "@trpc/server";
import type { AgentReviewRuns } from "@my-project/shared";
import type { SubstrateObjectRef } from "../../../clients/agentSubstrate/index.js";
import type { TRPCContext } from "../../../context/types.js";
import { rethrowOrHandleK8sError } from "../../k8s/utils/handleK8sError/index.js";
import { readAgentDetail } from "./agent.js";

const emptyReviewRuns = (): AgentReviewRuns => ({ mergeRequests: [], history: "ready" });

export async function getAgentReviewRuns(ctx: TRPCContext, ref: SubstrateObjectRef): Promise<AgentReviewRuns> {
  if (!ctx.reviewRunSource) return emptyReviewRuns();

  const read = await readAgentDetail(ctx, ref);
  if (read.state === "unreachable") {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Agent Substrate unreachable: ${read.reason}` });
  }
  if (read.state !== "ready" || !read.agent?.codebase) return emptyReviewRuns();

  const { codebase, issueBranch } = read.agent;
  try {
    return await ctx.reviewRunSource.listReviewRuns(ctx.session, { codebase, issueBranch });
  } catch (error) {
    rethrowOrHandleK8sError(error);
  }
}
