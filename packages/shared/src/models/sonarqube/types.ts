/**
 * SonarQube API TypeScript Types
 * Inferred from Zod schemas for type safety
 */

import { z } from "zod";
import {
  pagingSchema,
  sonarqubeProjectSchema,
  sonarqubeProjectsQueryParamsSchema,
  projectsSearchResponseSchema,
  measureSchema,
  componentWithMeasuresSchema,
  measuresComponentResponseSchema,
  normalizedMeasuresSchema,
  batchMeasureSchema,
  batchMeasuresResponseSchema,
  qualityGateConditionSchema,
  qualityGateProjectStatusSchema,
  qualityGateStatusResponseSchema,
  projectWithMetricsSchema,
  projectsWithMetricsResponseSchema,
} from "./schemas.js";

// =============================================================================
// Paging
// =============================================================================

export type Paging = z.infer<typeof pagingSchema>;

// =============================================================================
// Projects
// =============================================================================

export type SonarQubeProject = z.infer<typeof sonarqubeProjectSchema>;
export type SonarQubeProjectsQueryParams = z.infer<typeof sonarqubeProjectsQueryParamsSchema>;
export type ProjectsSearchResponse = z.infer<typeof projectsSearchResponseSchema>;

// =============================================================================
// Measures
// =============================================================================

export type Measure = z.infer<typeof measureSchema>;
export type ComponentWithMeasures = z.infer<typeof componentWithMeasuresSchema>;
export type MeasuresComponentResponse = z.infer<typeof measuresComponentResponseSchema>;
export type NormalizedMeasures = z.infer<typeof normalizedMeasuresSchema>;
export type BatchMeasure = z.infer<typeof batchMeasureSchema>;
export type BatchMeasuresResponse = z.infer<typeof batchMeasuresResponseSchema>;

// =============================================================================
// Quality Gate
// =============================================================================

export type QualityGateCondition = z.infer<typeof qualityGateConditionSchema>;
export type QualityGateProjectStatus = z.infer<typeof qualityGateProjectStatusSchema>;
export type QualityGateStatusResponse = z.infer<typeof qualityGateStatusResponseSchema>;

// =============================================================================
// Combined Project with Metrics
// =============================================================================

export type ProjectWithMetrics = z.infer<typeof projectWithMetricsSchema>;
export type ProjectsWithMetricsResponse = z.infer<typeof projectsWithMetricsResponseSchema>;
