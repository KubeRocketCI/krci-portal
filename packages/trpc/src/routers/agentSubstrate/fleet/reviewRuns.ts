import { TRPCError } from "@trpc/server";
import type { AgentReviewRuns } from "@my-project/shared";
import type { SubstrateObjectRef } from "../../../clients/agentSubstrate/index.js";
import type { TRPCContext } from "../../../context/types.js";
import { rethrowOrHandleK8sError } from "../../k8s/utils/handleK8sError/index.js";
import { getAgent } from "./agent.js";

const emptyReviewRuns = (): AgentReviewRuns => ({ mergeRequests: [] });

export async function getAgentReviewRuns(ctx: TRPCContext, ref: SubstrateObjectRef): Promise<AgentReviewRuns> {
  if (!ctx.reviewRunSource) return emptyReviewRuns();

  const read = await getAgent(ctx, ref);
  if (read.state === "unreachable") {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Agent Substrate unreachable: ${read.reason}` });
  }
  if (read.state !== "ready" || read.result.kind !== "agent") return emptyReviewRuns();

  const { codebase, issueBranch } = read.result.agent;
  if (!codebase) return emptyReviewRuns();

  try {
    return { mergeRequests: await ctx.reviewRunSource.listMergeRequests(ctx.session, { codebase, issueBranch }) };
  } catch (error) {
    rethrowOrHandleK8sError(error);
  }
}
