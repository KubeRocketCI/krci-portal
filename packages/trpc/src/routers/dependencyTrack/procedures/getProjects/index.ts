import { z } from "zod";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createDependencyTrackClient } from "../../../../clients/dependencyTrack/index.js";

/**
 * Get projects from Dependency Track
 *
 * Retrieves a paginated list of projects with optional filtering and sorting.
 * Supports search, active/inactive filtering, and hierarchical project views.
 */
export const getProjects = protectedProcedure
  .input(
    z.object({
      pageNumber: z.number().int().min(0).optional().default(0),
      pageSize: z.number().int().min(1).max(100).optional().default(25),
      sortName: z.string().optional(),
      sortOrder: z.enum(["asc", "desc"]).optional(),
      excludeInactive: z.boolean().optional().default(false),
      onlyRoot: z.boolean().optional().default(false),
      tag: z.string().optional(),
      classifier: z.string().optional(),
      searchTerm: z.string().optional(),
    })
  )
  .query(async ({ input }) => {
    const client = createDependencyTrackClient();

    return client.getProjects(input);
  });
