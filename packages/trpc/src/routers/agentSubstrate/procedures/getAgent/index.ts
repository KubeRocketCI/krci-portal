import { z } from "zod";
import { agentReadSchema, type AgentRead } from "@my-project/shared";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { getAgent } from "../../fleet/index.js";

/** `ObjectRef` atespace and name: `k8s-short-name` in the Agent Substrate proto (RFC 1123 label). */
const objectName = z
  .string()
  .max(63)
  .regex(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/);

export const agentRefSchema = z.object({ atespace: objectName, name: objectName }).strict();

/**
 * The Agent Substrate read uses the portal ServiceAccount. Per user, read with the user's `idToken`: the Codebase and
 * issue link of the agent.
 */
export const getAgentProcedure = protectedProcedure
  .input(agentRefSchema)
  .output(agentReadSchema)
  .query(({ ctx, input }): Promise<AgentRead> => getAgent(ctx, input));
