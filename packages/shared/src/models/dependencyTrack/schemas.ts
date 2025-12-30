/**
 * Dependency Track API Zod Schemas
 * Based on Dependency Track API v1: https://docs.dependencytrack.org/integrations/rest-api/
 *
 * All types should be inferred from these schemas for runtime validation and type safety.
 */

import { z } from "zod";

// =============================================================================
// Base Schemas (shared across metrics)
// =============================================================================

/**
 * Base vulnerability counts by severity - shared across all metrics schemas
 */
const baseVulnerabilityCountsSchema = z.object({
  critical: z.number(),
  high: z.number(),
  medium: z.number(),
  low: z.number(),
  unassigned: z.number(),
  vulnerabilities: z.number(),
});

/**
 * Base findings audit status - shared across metrics schemas
 */
const baseFindingsSchema = z.object({
  findingsTotal: z.number(),
  findingsAudited: z.number(),
  findingsUnaudited: z.number(),
});

/**
 * Base policy violations - shared across metrics schemas
 */
const basePolicyViolationsSchema = z.object({
  policyViolationsTotal: z.number(),
  policyViolationsFail: z.number(),
  policyViolationsWarn: z.number(),
  policyViolationsInfo: z.number(),
});

// =============================================================================
// Portfolio Metrics
// =============================================================================

/**
 * Portfolio metrics schema from Dependency Track API
 * GET /api/v1/metrics/portfolio/{days}/days
 */
export const portfolioMetricsSchema = baseVulnerabilityCountsSchema
  .merge(baseFindingsSchema)
  .merge(basePolicyViolationsSchema)
  .extend({
    // Project/component statistics
    projects: z.number(),
    vulnerableProjects: z.number(),
    components: z.number(),
    vulnerableComponents: z.number(),

    // Additional findings fields
    suppressed: z.number(),
    inheritedRiskScore: z.number(),

    // Additional policy violations fields
    policyViolationsAudited: z.number(),
    policyViolationsUnaudited: z.number(),

    // Policy violations by type
    policyViolationsSecurityTotal: z.number(),
    policyViolationsSecurityAudited: z.number(),
    policyViolationsSecurityUnaudited: z.number(),
    policyViolationsLicenseTotal: z.number(),
    policyViolationsLicenseAudited: z.number(),
    policyViolationsLicenseUnaudited: z.number(),
    policyViolationsOperationalTotal: z.number(),
    policyViolationsOperationalAudited: z.number(),
    policyViolationsOperationalUnaudited: z.number(),

    // Timestamps (Unix milliseconds)
    firstOccurrence: z.number(),
    lastOccurrence: z.number(),
  });

/**
 * Response from portfolio metrics endpoint
 */
export const portfolioMetricsResponseSchema = z.array(portfolioMetricsSchema);

// =============================================================================
// Projects
// =============================================================================

/**
 * Tag associated with a project
 */
export const dependencyTrackTagSchema = z.object({
  name: z.string(),
});

/**
 * Project metrics from Dependency Track
 */
export const dependencyTrackProjectMetricsSchema = baseVulnerabilityCountsSchema
  .merge(baseFindingsSchema)
  .merge(basePolicyViolationsSchema)
  .extend({
    components: z.number(),
    services: z.number(),
    policyViolationsLicenseTotal: z.number(),
    policyViolationsOperationalTotal: z.number(),
    policyViolationsSecurityTotal: z.number(),
  });

/**
 * Project from Dependency Track API (recursive type with lazy schema)
 * GET /api/v1/project
 */
export const dependencyTrackProjectSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    uuid: z.string(),
    name: z.string(),
    version: z.string(),
    description: z.string().optional(),
    isLatest: z.boolean(),
    classifier: z.string(),
    active: z.boolean(),
    tags: z.array(dependencyTrackTagSchema).optional(),
    lastBomImport: z.number().optional(),
    lastBomImportFormat: z.string().optional(),
    lastInheritedRiskScore: z.number(),
    lastVulnerabilityAnalysis: z.number().optional(),

    // Parent/child relationships (recursive)
    parent: dependencyTrackProjectSchema.optional(),
    children: z.array(dependencyTrackProjectSchema).optional(),
    versions: z.array(dependencyTrackProjectSchema).optional(),

    // Metrics
    metrics: dependencyTrackProjectMetricsSchema.optional(),
  })
);

/**
 * Query parameters for projects endpoint
 */
export const projectsQueryParamsSchema = z.object({
  pageNumber: z.number().int().min(0).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
  sortName: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  excludeInactive: z.boolean().optional(),
  onlyRoot: z.boolean().optional(),
  tag: z.string().optional(),
  classifier: z.string().optional(),
  searchTerm: z.string().optional(),
});

/**
 * Response from projects endpoint
 */
export const projectsResponseSchema = z.object({
  projects: z.array(dependencyTrackProjectSchema),
  totalCount: z.number(),
});

// =============================================================================
// Components
// =============================================================================

/**
 * Component metrics from Dependency Track
 */
export const dependencyTrackComponentMetricsSchema = baseVulnerabilityCountsSchema;

/**
 * Resolved license information
 */
export const dependencyTrackResolvedLicenseSchema = z.object({
  licenseId: z.string(),
  name: z.string(),
});

/**
 * Repository metadata for component version checking
 */
export const dependencyTrackRepositoryMetaSchema = z.object({
  latestVersion: z.string().optional(),
});

/**
 * Component from Dependency Track API
 * GET /api/v1/component/project/{uuid}
 */
export const dependencyTrackComponentSchema = z.object({
  uuid: z.string(),
  name: z.string(),
  version: z.string(),
  group: z.string().optional(),
  classifier: z.string().optional(),
  scope: z.string().optional(),
  isInternal: z.boolean(),
  license: z.string().optional(),
  licenseExpression: z.string().optional(),
  resolvedLicense: dependencyTrackResolvedLicenseSchema.optional(),
  repositoryMeta: dependencyTrackRepositoryMetaSchema.optional(),
  lastInheritedRiskScore: z.number(),
  metrics: dependencyTrackComponentMetricsSchema.optional(),
});

/**
 * Query parameters for components endpoint
 */
export const componentsQueryParamsSchema = z.object({
  pageNumber: z.number().int().min(0).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
  sortName: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  onlyOutdated: z.boolean().optional(),
  onlyDirect: z.boolean().optional(),
});

/**
 * Response from components endpoint
 */
export const componentsResponseSchema = z.object({
  components: z.array(dependencyTrackComponentSchema),
  totalCount: z.number(),
});

// =============================================================================
// Services
// =============================================================================

/**
 * Service metrics
 */
export const dependencyTrackServiceMetricsSchema = baseVulnerabilityCountsSchema
  .merge(baseFindingsSchema)
  .merge(basePolicyViolationsSchema)
  .extend({
    components: z.number(),
    vulnerableComponents: z.number(),
    suppressed: z.number(),
    inheritedRiskScore: z.number(),
    policyViolationsAudited: z.number(),
    policyViolationsUnaudited: z.number(),
    policyViolationsSecurityTotal: z.number(),
    policyViolationsLicenseTotal: z.number(),
    policyViolationsOperationalTotal: z.number(),
    firstOccurrence: z.number().optional(),
    lastOccurrence: z.number().optional(),
  });

/**
 * Service from Dependency Track API
 * GET /api/v1/service/project/{uuid}
 */
export const dependencyTrackServiceSchema = z.object({
  uuid: z.string(),
  name: z.string(),
  version: z.string().optional(),
  group: z.string().optional(),
  description: z.string().optional(),
  authenticated: z.boolean(),
  crossesTrustBoundary: z.boolean(),
  lastInheritedRiskScore: z.number(),
  metrics: dependencyTrackServiceMetricsSchema.optional(),
  endpoints: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

/**
 * Query parameters for services endpoint
 */
export const servicesQueryParamsSchema = z.object({
  pageNumber: z.number().int().min(0).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
  sortName: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

/**
 * Response from services endpoint
 */
export const servicesResponseSchema = z.object({
  services: z.array(dependencyTrackServiceSchema),
  totalCount: z.number(),
});

// =============================================================================
// Dependency Graph
// =============================================================================

/**
 * Dependency graph node from Dependency Track API
 * GET /api/v1/dependencyGraph/project/{uuid}/directDependencies
 */
export const dependencyGraphNodeSchema = z.object({
  uuid: z.string(),
  name: z.string(),
  version: z.string().optional(),
  purl: z.string().optional(),
  purlCoordinates: z.string().optional(),
  groupId: z.string().optional(),
  directDependencies: z.string().optional(), // JSON string of nested dependencies
  latestVersion: z.string().optional(),
  objectType: z.enum(["PROJECT", "COMPONENT", "SERVICE"]).optional(),
});

/**
 * Response from dependency graph endpoint
 */
export const dependencyGraphResponseSchema = z.array(dependencyGraphNodeSchema);

// =============================================================================
// Findings
// =============================================================================

/**
 * Finding component from Dependency Track API
 */
export const findingComponentSchema = z.object({
  uuid: z.string(),
  name: z.string(),
  version: z.string().optional(),
  group: z.string().optional(),
  latestVersion: z.string().optional(),
});

/**
 * Finding vulnerability from Dependency Track API
 */
export const findingVulnerabilitySchema = z.object({
  vulnId: z.string(),
  source: z.string(),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO", "UNASSIGNED"]),
  severityRank: z.number().optional(),
  cwes: z.array(z.object({ cweId: z.number(), name: z.string() })).optional(),
  aliases: z.array(z.object({ source: z.string(), vulnId: z.string() })).optional(),
  cvssV2BaseScore: z.number().optional(),
  cvssV3BaseScore: z.number().optional(),
  epssScore: z.number().optional(),
  epssPercentile: z.number().optional(),
});

/**
 * Finding analysis from Dependency Track API
 */
export const findingAnalysisSchema = z.object({
  state: z.enum(["EXPLOITABLE", "IN_TRIAGE", "RESOLVED", "FALSE_POSITIVE", "NOT_AFFECTED", "NOT_SET"]),
  isSuppressed: z.boolean(),
});

/**
 * Finding attribution from Dependency Track API
 */
export const findingAttributionSchema = z.object({
  analyzerIdentity: z.string(),
  attributedOn: z.number(),
  alternateIdentifier: z.string().optional(),
  referenceUrl: z.string().optional(),
});

/**
 * Finding from Dependency Track API
 * GET /api/v1/finding/project/{uuid}
 */
export const findingSchema = z.object({
  component: findingComponentSchema,
  vulnerability: findingVulnerabilitySchema,
  analysis: findingAnalysisSchema,
  attribution: findingAttributionSchema,
  matrix: z.string(),
});

/**
 * Query parameters for findings endpoint
 */
export const findingsQueryParamsSchema = z.object({
  suppressed: z.boolean().optional(),
  source: z.string().optional(),
});

/**
 * Response from findings endpoint
 */
export const findingsResponseSchema = z.array(findingSchema);

// =============================================================================
// Policy Violations
// =============================================================================

/**
 * Policy violation analysis from Dependency Track API
 */
export const violationAnalysisSchema = z.object({
  analysisState: z.enum(["APPROVED", "REJECTED", "NOT_SET"]),
  isSuppressed: z.boolean(),
});

/**
 * Policy from Dependency Track API
 */
export const policySchema = z.object({
  name: z.string(),
  violationState: z.enum(["INFO", "WARN", "FAIL"]),
});

/**
 * Policy condition from Dependency Track API
 */
export const policyConditionSchema = z.object({
  policy: policySchema,
  subject: z.string().optional(),
  operator: z.string().optional(),
  value: z.string().optional(),
});

/**
 * Policy violation component (simplified)
 */
export const violationComponentSchema = z.object({
  uuid: z.string(),
  name: z.string(),
  version: z.string().optional(),
  group: z.string().optional(),
});

/**
 * Policy violation from Dependency Track API
 * GET /api/v1/violation/project/{uuid}
 */
export const policyViolationSchema = z.object({
  uuid: z.string(),
  type: z.enum(["LICENSE", "SECURITY", "OPERATIONAL"]),
  timestamp: z.number(),
  policyCondition: policyConditionSchema,
  component: violationComponentSchema.optional(),
  analysis: violationAnalysisSchema,
  text: z.string().optional(),
});

/**
 * Query parameters for violations endpoint
 */
export const violationsQueryParamsSchema = z.object({
  suppressed: z.boolean().optional(),
  pageNumber: z.number().int().min(0).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
});

/**
 * Response from violations endpoint
 */
export const violationsResponseSchema = z.array(policyViolationSchema);
