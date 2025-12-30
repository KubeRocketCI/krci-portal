import { z } from "zod";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createDependencyTrackClient } from "../../../../clients/dependencyTrack/index.js";
import { DEFAULT_PORTFOLIO_METRICS_DAYS } from "@my-project/shared";

/**
 * Get portfolio metrics from Dependency Track
 *
 * Retrieves vulnerability and project metrics over a specified time period.
 * Data includes severity breakdowns, project counts, findings, and policy violations.
 */
export const getPortfolioMetrics = protectedProcedure
  .input(
    z.object({
      days: z
        .number()
        .int()
        .min(1, "Days must be at least 1")
        .max(365, "Days cannot exceed 365")
        .default(DEFAULT_PORTFOLIO_METRICS_DAYS),
    })
  )
  .query(async ({ input }) => {
    const { days } = input;
    const client = createDependencyTrackClient();

    return client.getPortfolioMetrics(days);
  });
