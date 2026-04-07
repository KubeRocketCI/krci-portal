import { z } from "zod";
import { tektonResultsListOutputSchema } from "@my-project/shared";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createTektonResultsClient } from "../../../../clients/tektonResults/index.js";
import { tektonInputSchemas } from "../../utils.js";

/**
 * Get PipelineRun results from the Tekton Results `ListResults` API.
 *
 * Queries the `results` table which has denormalized summary columns and
 * annotations — significantly faster than `getPipelineRunRecords` which
 * decodes full PipelineRun JSON blobs from the `records` table.
 *
 * Returns raw Result objects (name, uid, annotations, summary) without
 * decoding any record data. The caller is responsible for mapping the
 * annotation/summary fields to its domain model.
 */
export const getPipelineRunResultsProcedure = protectedProcedure
  .meta({ openapi: { method: "GET", path: "/v1/pipeline-runs", protect: true, tags: ["tekton-results"] } })
  .input(
    z.object({
      namespace: tektonInputSchemas.namespace,
      pageSize: z.number().optional().default(50),
      pageToken: z.string().optional(),
      filter: tektonInputSchemas.celFilter,
    })
  )
  .output(tektonResultsListOutputSchema)
  .query(async ({ input }) => {
    const { namespace, pageSize, pageToken, filter } = input;
    const client = createTektonResultsClient(namespace);

    const typeFilter = `summary.type == 'tekton.dev/v1.PipelineRun'`;
    const combinedFilter = filter ? `${typeFilter} && (${filter})` : typeFilter;

    const response = await client.listResults({
      filter: combinedFilter,
      pageSize,
      pageToken,
      orderBy: "create_time desc",
    });

    return {
      results: response?.results || [],
      nextPageToken: response?.next_page_token || undefined,
    };
  });
