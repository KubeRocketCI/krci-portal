import { z } from "zod";
import type { FleetSnapshot } from "@my-project/shared";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { getFleet } from "../../fleet/index.js";

/** Read with the portal ServiceAccount: every signed-in user gets the same fleet. */
export const getFleetProcedure = protectedProcedure
  .input(z.object({}).strict())
  .query(({ ctx }): Promise<FleetSnapshot> => getFleet(ctx));
