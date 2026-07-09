import type { z } from "zod";
import type {
  deploymentMetricsInputSchema,
  deploymentMetricsOutputSchema,
  promqlMatrixResponseSchema,
  promqlVectorResponseSchema,
  metricSeriesPointSchema,
  metricSeriesByAppSchema,
  metricSeriesByPodSchema,
  podPhaseSchema,
  podPhaseByAppSchema,
  pipelineRunMetricsInputSchema,
  pipelineRunMetricsOutputSchema,
  metricSeriesByStepSchema,
  taskMetricSeriesSchema,
} from "./schemas.js";
import type { METRIC_RANGE_VALUES } from "./constants.js";

export type DeploymentMetricsInput = z.infer<typeof deploymentMetricsInputSchema>;
export type DeploymentMetricsOutput = z.infer<typeof deploymentMetricsOutputSchema>;
export type PromQLMatrixResponse = z.infer<typeof promqlMatrixResponseSchema>;
export type PromQLVectorResponse = z.infer<typeof promqlVectorResponseSchema>;
export type MetricRange = (typeof METRIC_RANGE_VALUES)[number];
export type MetricSeriesPoint = z.infer<typeof metricSeriesPointSchema>;
export type MetricSeriesByApp = z.infer<typeof metricSeriesByAppSchema>;
export type MetricSeriesByPod = z.infer<typeof metricSeriesByPodSchema>;
export type PodPhase = z.infer<typeof podPhaseSchema>;
export type PodPhaseByApp = z.infer<typeof podPhaseByAppSchema>;
export type PipelineRunMetricsInput = z.infer<typeof pipelineRunMetricsInputSchema>;
export type PipelineRunMetricsOutput = z.infer<typeof pipelineRunMetricsOutputSchema>;
export type MetricSeriesByStep = z.infer<typeof metricSeriesByStepSchema>;
export type TaskMetricSeries = z.infer<typeof taskMetricSeriesSchema>;
