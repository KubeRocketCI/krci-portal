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
  projectKeys: z.string().optional(), // Comma-separated list of exact project keys
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

// =============================================================================
// Issues
// =============================================================================

/**
 * Issue severity levels
 */
export const issueSeveritySchema = z.enum(["BLOCKER", "CRITICAL", "MAJOR", "MINOR", "INFO"]);

/**
 * Issue types
 */
export const issueTypeSchema = z.enum(["BUG", "VULNERABILITY", "CODE_SMELL"]);

/**
 * Issue status
 */
export const issueStatusSchema = z.enum(["OPEN", "CONFIRMED", "REOPENED", "RESOLVED", "CLOSED"]);

/**
 * Single issue from /api/issues/search
 */
export const sonarQubeIssueSchema = z.object({
  key: z.string(),
  component: z.string(), // File path
  componentLongName: z.string().optional(),
  project: z.string(),
  rule: z.string(),
  message: z.string(),
  line: z.number().optional(),
  severity: issueSeveritySchema,
  type: issueTypeSchema,
  status: issueStatusSchema,
  effort: z.string().optional(), // e.g., "5min"
  debt: z.string().optional(), // Technical debt
  creationDate: z.string(),
  updateDate: z.string().optional(),
  flows: z.array(z.any()).optional(), // Issue flows
  tags: z.array(z.string()).optional(),
});

/**
 * Component metadata from issues search response
 */
export const issueComponentSchema = z.object({
  key: z.string(),
  enabled: z.boolean().optional(),
  qualifier: z.string().optional(),
  name: z.string().optional(),
  longName: z.string().optional(),
  path: z.string().optional(),
});

/**
 * Rule metadata from issues search response
 */
export const issueRuleSchema = z.object({
  key: z.string(),
  name: z.string().optional(),
  lang: z.string().optional(),
  status: z.string().optional(),
  langName: z.string().optional(),
});

/**
 * Issues search response from /api/issues/search
 */
export const issuesSearchResponseSchema = z.object({
  total: z.number(),
  p: z.number(), // Current page
  ps: z.number(), // Page size
  paging: pagingSchema,
  issues: z.array(sonarQubeIssueSchema),
  components: z.array(issueComponentSchema).optional(),
  rules: z.array(issueRuleSchema).optional(),
});

/**
 * Issues query parameters for /api/issues/search
 */
export const issuesQueryParamsSchema = z.object({
  componentKeys: z.string(), // Project key
  resolved: z.enum(["true", "false"]).optional().default("false"),
  types: z.string().optional(), // Comma-separated: BUG,VULNERABILITY,CODE_SMELL
  severities: z.string().optional(), // Comma-separated: BLOCKER,CRITICAL,MAJOR,MINOR,INFO
  statuses: z.string().optional(),
  p: z.number().int().min(1).optional().default(1),
  ps: z.number().int().min(1).max(500).optional().default(25),
  s: z.string().optional(), // Sort field
  asc: z.enum(["true", "false"]).optional(),
});
