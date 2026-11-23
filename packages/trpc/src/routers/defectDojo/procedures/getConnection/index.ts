import { z } from "zod";
import { isDefectDojoConfigured } from "../../../../clients/defectDojo/index.js";
import { protectedProcedure } from "../../../../procedures/protected/index.js";

/** Whether the server holds the DefectDojo URL and token. Sends no request to DefectDojo and returns no setting. */
export const getConnectionProcedure = protectedProcedure
  .input(z.void())
  .output(z.object({ configured: z.boolean() }))
  .query(() => ({ configured: isDefectDojoConfigured(process.env) }));
