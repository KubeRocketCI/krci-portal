import { TRPCError } from "@trpc/server";
import type { FleetSnapshot } from "@my-project/shared";
import type { TRPCContext } from "../../../context/types.js";

export async function getFleet(ctx: TRPCContext): Promise<FleetSnapshot> {
  if (!ctx.agentSubstrateSource) {
    return { state: "notConfigured" };
  }

  throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Agent Substrate fleet read is not implemented" });
}
