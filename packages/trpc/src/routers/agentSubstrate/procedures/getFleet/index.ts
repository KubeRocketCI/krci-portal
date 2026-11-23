import { z } from "zod";
import { fleetSnapshotSchema, type FleetSnapshot } from "@my-project/shared";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { getFleet } from "../../fleet/index.js";

/**
 * The Agent Substrate read uses the portal ServiceAccount and is the same for every signed-in user. Per user, read with
 * the user's `idToken`: Codebase and issue link of each agent, `workerPools.access` and each row's `resource`.
 */
export const getFleetProcedure = protectedProcedure
  .input(z.object({}).strict())
  .output(fleetSnapshotSchema)
  .query(({ ctx }): Promise<FleetSnapshot> => getFleet(ctx));
