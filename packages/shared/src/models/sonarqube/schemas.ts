/**
 * SonarQube API Zod Schemas
 * Based on SonarQube Web API v1
 *
 * All types should be inferred from these schemas for runtime validation and type safety.
 */

import { z } from "zod";

// =============================================================================
// Paging
// =============================================================================

/**
 * Standard paging response from SonarQube API
 */
export const pagingSchema = z.object({
  pageIndex: z.number(),
  pageSize: z.number(),
  total: z.number(),
});

// =============================================================================
// Projects
// =============================================================================

/**
 * Project from SonarQube API
 * GET /api/projects/search
 */
export const sonarqubeProjectSchema = z.object({
  key: z.string(),
  name: z.string(),
  qualifier: z.string().optional(),
  visibility: z.enum(["public", "private"]).optional(),
  lastAnalysisDate: z.string().optional(),
  revision: z.string().optional(),
  managed: z.boolean().optional(),
});

/**
 * Query parameters for projects search endpoint
 */
export const sonarqubeProjectsQueryParamsSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(500).optional().default(50),
  searchTerm: z.string().optional(),
  analyzedBefore: z.string().optional(),
  onProvisionedOnly: z.boolean().optional(),
  qualifiers: z.string().optional(),
});

/**
 * Response from projects search endpoint
 */
export const projectsSearchResponseSchema = z.object({
  paging: pagingSchema,
  components: z.array(sonarqubeProjectSchema),
});

// =============================================================================
// Measures
// =============================================================================

/**
 * Single measure value
 */
export const measureSchema = z.object({
  metric: z.string(),
  value: z.string().optional(),
  bestValue: z.boolean().optional(),
});

/**
 * Component with measures from SonarQube API
 * GET /api/measures/component
 */
export const componentWithMeasuresSchema = z.object({
  key: z.string(),
  name: z.string(),
  qualifier: z.string().optional(),
  measures: z.array(measureSchema),
});

/**
 * Response from measures component endpoint
 */
export const measuresComponentResponseSchema = z.object({
  component: componentWithMeasuresSchema,
});

/**
 * Normalized measures as a key-value map for easier access
 */
export const normalizedMeasuresSchema = z.record(z.string(), z.string());

/**
 * Single measure from batch search endpoint
 * GET /api/measures/search
 */
export const batchMeasureSchema = z.object({
  metric: z.string(),
  value: z.string().optional(),
  component: z.string(),
  bestValue: z.boolean().optional(),
});

/**
 * Response from batch measures search endpoint
 * GET /api/measures/search
 */
export const batchMeasuresResponseSchema = z.object({
  measures: z.array(batchMeasureSchema),
});

// =============================================================================
// Quality Gate
// =============================================================================

/**
 * Quality gate condition
 */
export const qualityGateConditionSchema = z.object({
  status: z.enum(["OK", "WARN", "ERROR", "NONE"]),
  metricKey: z.string(),
  comparator: z.string().optional(),
  errorThreshold: z.string().optional(),
  actualValue: z.string().optional(),
});

/**
 * Quality gate project status
 * GET /api/qualitygates/project_status
 */
export const qualityGateProjectStatusSchema = z.object({
  status: z.enum(["OK", "WARN", "ERROR", "NONE"]),
  conditions: z.array(qualityGateConditionSchema).optional(),
  ignoredConditions: z.boolean().optional(),
});

/**
 * Response from quality gate project status endpoint
 */
export const qualityGateStatusResponseSchema = z.object({
  projectStatus: qualityGateProjectStatusSchema,
});

// =============================================================================
// Combined Project with Metrics
// =============================================================================

/**
 * Project with all metrics and quality gate status
 * This is the combined response we return from our tRPC procedure
 */
export const projectWithMetricsSchema = sonarqubeProjectSchema.extend({
  measures: normalizedMeasuresSchema.optional(),
  qualityGateStatus: z.enum(["OK", "WARN", "ERROR", "NONE"]).optional(),
});

/**
 * Response from our getProjects procedure
 */
export const projectsWithMetricsResponseSchema = z.object({
  projects: z.array(projectWithMetricsSchema),
  paging: pagingSchema,
});
