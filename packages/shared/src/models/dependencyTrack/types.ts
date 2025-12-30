/**
 * Dependency Track API Types
 * Based on Dependency Track API v1: https://docs.dependencytrack.org/integrations/rest-api/
 *
 * All types are inferred from Zod schemas for runtime validation and type safety.
 */

import { z } from "zod";
import {
  portfolioMetricsSchema,
  portfolioMetricsResponseSchema,
  dependencyTrackTagSchema,
  dependencyTrackProjectMetricsSchema,
  dependencyTrackProjectSchema,
  projectsQueryParamsSchema,
  projectsResponseSchema,
  dependencyTrackComponentMetricsSchema,
  dependencyTrackResolvedLicenseSchema,
  dependencyTrackRepositoryMetaSchema,
  dependencyTrackComponentSchema,
  componentsQueryParamsSchema,
  componentsResponseSchema,
  dependencyTrackServiceMetricsSchema,
  dependencyTrackServiceSchema,
  servicesQueryParamsSchema,
  servicesResponseSchema,
  dependencyGraphNodeSchema,
  dependencyGraphResponseSchema,
  findingComponentSchema,
  findingVulnerabilitySchema,
  findingAnalysisSchema,
  findingAttributionSchema,
  findingSchema,
  findingsQueryParamsSchema,
  findingsResponseSchema,
  violationAnalysisSchema,
  policySchema,
  policyConditionSchema,
  violationComponentSchema,
  policyViolationSchema,
  violationsQueryParamsSchema,
  violationsResponseSchema,
} from "./schemas.js";

// =============================================================================
// Portfolio Metrics Types
// =============================================================================

export type PortfolioMetrics = z.infer<typeof portfolioMetricsSchema>;
export type PortfolioMetricsResponse = z.infer<typeof portfolioMetricsResponseSchema>;

// =============================================================================
// Project Types
// =============================================================================

export type DependencyTrackTag = z.infer<typeof dependencyTrackTagSchema>;
export type DependencyTrackProjectMetrics = z.infer<typeof dependencyTrackProjectMetricsSchema>;
export type DependencyTrackProject = z.infer<typeof dependencyTrackProjectSchema>;
export type ProjectsQueryParams = z.infer<typeof projectsQueryParamsSchema>;
export type ProjectsResponse = z.infer<typeof projectsResponseSchema>;

// =============================================================================
// Component Types
// =============================================================================

export type DependencyTrackComponentMetrics = z.infer<typeof dependencyTrackComponentMetricsSchema>;
export type DependencyTrackResolvedLicense = z.infer<typeof dependencyTrackResolvedLicenseSchema>;
export type DependencyTrackRepositoryMeta = z.infer<typeof dependencyTrackRepositoryMetaSchema>;
export type DependencyTrackComponent = z.infer<typeof dependencyTrackComponentSchema>;
export type ComponentsQueryParams = z.infer<typeof componentsQueryParamsSchema>;
export type ComponentsResponse = z.infer<typeof componentsResponseSchema>;

// =============================================================================
// Service Types
// =============================================================================

export type DependencyTrackServiceMetrics = z.infer<typeof dependencyTrackServiceMetricsSchema>;
export type DependencyTrackService = z.infer<typeof dependencyTrackServiceSchema>;
export type ServicesQueryParams = z.infer<typeof servicesQueryParamsSchema>;
export type ServicesResponse = z.infer<typeof servicesResponseSchema>;

// =============================================================================
// Dependency Graph Types
// =============================================================================

export type DependencyGraphNode = z.infer<typeof dependencyGraphNodeSchema>;
export type DependencyGraphResponse = z.infer<typeof dependencyGraphResponseSchema>;

// =============================================================================
// Finding Types
// =============================================================================

export type FindingComponent = z.infer<typeof findingComponentSchema>;
export type FindingVulnerability = z.infer<typeof findingVulnerabilitySchema>;
export type FindingAnalysis = z.infer<typeof findingAnalysisSchema>;
export type FindingAttribution = z.infer<typeof findingAttributionSchema>;
export type Finding = z.infer<typeof findingSchema>;
export type FindingsQueryParams = z.infer<typeof findingsQueryParamsSchema>;
export type FindingsResponse = z.infer<typeof findingsResponseSchema>;

// =============================================================================
// Policy Violation Types
// =============================================================================

export type ViolationAnalysis = z.infer<typeof violationAnalysisSchema>;
export type Policy = z.infer<typeof policySchema>;
export type PolicyCondition = z.infer<typeof policyConditionSchema>;
export type ViolationComponent = z.infer<typeof violationComponentSchema>;
export type PolicyViolation = z.infer<typeof policyViolationSchema>;
export type ViolationsQueryParams = z.infer<typeof violationsQueryParamsSchema>;
export type ViolationsResponse = z.infer<typeof violationsResponseSchema>;
