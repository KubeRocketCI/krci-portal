import { z } from "zod";
import { fleetSnapshotSchema, type FleetSnapshot } from "@my-project/shared";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { getFleet } from "../../fleet/index.js";

/** Read with the portal ServiceAccount: every signed-in user gets the same fleet. */
export const getFleetProcedure = protectedProcedure
  .input(z.object({}).strict())
  .output(fleetSnapshotSchema)
  .query(({ ctx }): Promise<FleetSnapshot> => getFleet(ctx));
