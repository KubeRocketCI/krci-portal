import { z } from "zod";
import { protectedProcedure } from "../../../../procedures/protected/index.js";
import { createTektonResultsClient } from "../../../../clients/tektonResults/index.js";
import { DEFAULT_SUMMARY_METRICS } from "@my-project/shared";

/**
 * Valid summary metric names per Tekton Results API
 * @see aggregator.go summaryFuncs map
 */
const VALID_SUMMARY_METRICS = [
  "total",
  "succeeded",
  "failed",
  "cancelled",
  "running",
  "others",
  "avg_duration",
  "min_duration",
  "max_duration",
  "total_duration",
  "last_runtime",
] as const;

/**
 * Valid group_by values per Tekton Results API
 * @see aggregator.go validGroups map
 */
const VALID_GROUP_BY = [
  "minute",
  "hour",
  "day",
  "week",
  "month",
  "year",
  "pipeline",
  "namespace",
  "repository",
] as const;

/**
 * Valid time fields for time-based grouping
 */
const VALID_TIME_FIELDS = ["startTime", "completionTime"] as const;

/**
 * Validates summary parameter format (comma-separated valid metrics)
 */
const summarySchema = z
  .string()
  .optional()
  .default(DEFAULT_SUMMARY_METRICS)
  .refine(
    (val) => {
      const metrics = val.split(",").map((m) => m.trim());
      return metrics.every((m) => VALID_SUMMARY_METRICS.includes(m as (typeof VALID_SUMMARY_METRICS)[number]));
    },
    {
      message: `Invalid summary metric. Valid values: ${VALID_SUMMARY_METRICS.join(", ")}`,
    }
  );

/**
 * Validates groupBy parameter format
 * Accepts: "hour", "day", "week", "pipeline", "hour startTime", "day completionTime", etc.
 */
const groupBySchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      const parts = val.trim().split(" ");
      if (parts.length === 0 || parts.length > 2) return false;

      const groupBy = parts[0];
      if (!VALID_GROUP_BY.includes(groupBy as (typeof VALID_GROUP_BY)[number])) {
        return false;
      }

      // If time field specified, validate it
      if (parts.length === 2) {
        const timeField = parts[1];
        // Time field only valid for time-based grouping
        const isTimeGroup = ["minute", "hour", "day", "week", "month", "year"].includes(groupBy);
        if (!isTimeGroup) return false;
        if (!VALID_TIME_FIELDS.includes(timeField as (typeof VALID_TIME_FIELDS)[number])) {
          return false;
        }
      }

      return true;
    },
    {
      message: `Invalid groupBy. Valid values: ${VALID_GROUP_BY.join(", ")}. Time groups can include time field: "hour startTime"`,
    }
  );

/**
 * Validates orderBy parameter format: "field ASC|DESC"
 */
const orderBySchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      const match = val.trim().match(/^(\w+)\s+(ASC|DESC|asc|desc)$/i);
      if (!match) return false;

      const field = match[1];
      return VALID_SUMMARY_METRICS.includes(field as (typeof VALID_SUMMARY_METRICS)[number]);
    },
    {
      message: `Invalid orderBy. Format: "field ASC|DESC" where field is a valid summary metric`,
    }
  );

export const getSummaryProcedure = protectedProcedure
  .input(
    z.object({
      namespace: z.string().min(1, "Namespace is required"),
      summary: summarySchema,
      groupBy: groupBySchema,
      filter: z.string().optional(),
      orderBy: orderBySchema,
    })
  )
  .query(async ({ input }) => {
    const { namespace, summary, groupBy, filter, orderBy } = input;
    const client = createTektonResultsClient(namespace);

    return await client.getSummary({
      summary,
      groupBy,
      filter,
      orderBy,
    });
  });
