import { z } from "zod";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createTektonResultsClient } from "../../../../clients/tektonResults/index.js";

export const listTektonResultsProcedure = protectedProcedure
  .input(
    z.object({
      namespace: z.string(),
      filter: z.string().optional(),
      pageSize: z.number().optional().default(50),
      pageToken: z.string().optional(),
      orderBy: z.string().optional().default("create_time desc"),
    })
  )
  .query(async ({ input }) => {
    const { namespace, filter, pageSize, pageToken, orderBy } = input;
    const client = createTektonResultsClient(namespace);

    return await client.listResults({
      filter,
      pageSize,
      pageToken,
      orderBy,
    });
  });
