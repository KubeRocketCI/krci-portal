import { pipelineType, tektonResultAnnotations } from "@my-project/shared";

/**
 * Escape a value for safe interpolation into a CEL string literal.
 * Prevents CEL expression injection via crafted URL parameters.
 *
 * In practice this is a no-op for valid K8s resource names (which only
 * contain [a-z0-9-.]) but guards against malicious input from URL params.
 */
export function escapeCELString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

const PIPELINE_RUN_DATA_TYPE = "data_type == 'tekton.dev/v1.PipelineRun'";

/** Small page size for single-record lookups by name (buffer for potential collisions). */
export const SINGLE_RECORD_LOOKUP_PAGE_SIZE = 6;

export const buildPipelineRunNameFilter = (pipelineRunName: string): string => {
  return `data.metadata.name == '${escapeCELString(pipelineRunName)}' && ${PIPELINE_RUN_DATA_TYPE}`;
};

// ---------------------------------------------------------------------------
// Annotation-based CEL builder (for Results table queries).
// The `results` table stores annotations at the top level, so filters use
// `annotations["key"] == "value"` instead of `data.metadata.labels["key"]`.
// ---------------------------------------------------------------------------

/** Build a CEL annotation equality clause: `annotations["key"] == 'value'` */
function buildAnnotationClause(annotationKey: string, value: string): string {
  return `annotations["${annotationKey}"] == '${escapeCELString(value)}'`;
}

/** Join CEL clauses with `||`. A single clause is returned bare; several are wrapped in parentheses. */
function wrapOr(clauses: readonly string[]): string {
  if (clauses.length === 1) return clauses[0];
  return `(${clauses.join(" || ")})`;
}

/**
 * Build a combined CEL filter from an annotations record, targeting Result-level annotations.
 * Each entry becomes `annotations["key"] == 'value'`, joined with ` && `.
 * Returns undefined when the annotations record is empty.
 *
 * Used with `getPipelineRunResults` which queries the `results` table where
 * K8s labels are stored as Result-level annotations.
 */
export function buildAnnotationsFilter(annotations: Record<string, string>): string | undefined {
  const entries = Object.entries(annotations);
  if (entries.length === 0) return undefined;
  return entries.map(([key, value]) => buildAnnotationClause(key, value)).join(" && ");
}

// ---------------------------------------------------------------------------
// Name-based search filter (for Results table queries).
// Filters by the `object.metadata.name` annotation which stores the original
// PipelineRun metadata.name on every Result.
// ---------------------------------------------------------------------------

/**
 * Build a CEL filter that matches PipelineRun names containing the search term.
 * Returns undefined when the search term is empty.
 */
export function buildNameSearchFilter(searchTerm: string): string | undefined {
  const trimmed = searchTerm.trim();
  if (!trimmed) return undefined;
  return `annotations["${tektonResultAnnotations.objectMetadataName}"].contains('${escapeCELString(trimmed)}')`;
}

// ---------------------------------------------------------------------------
// Status filter (for Results table queries).
// Tekton Results stores status in the top-level `summary.status` field using
// its own proto enum, compared as int (string literals cause a CEL type
// error). The mapping from PipelineRun phase to enum ints, and the decision
// of which phases apply to history at all, live in `pipelineRunStatusFilter.ts`.
// ---------------------------------------------------------------------------

/** Build a CEL clause on `summary.status` from a list of proto enum integers. */
export function buildSummaryStatusClause(ints: readonly number[]): string {
  return wrapOr(ints.map((n) => `summary.status == ${n}`));
}

// ---------------------------------------------------------------------------
// Pipeline type filter (for Results table queries).
// The pipeline type is stored as the `app.edp.epam.com/pipelinetype` annotation.
// ---------------------------------------------------------------------------

/**
 * Build a CEL filter on the pipeline type annotation.
 * Returns undefined when type is "all" or empty.
 */
export function buildPipelineTypeFilter(pipelineType: string): string | undefined {
  if (!pipelineType || pipelineType === "all") return undefined;
  return buildAnnotationClause(tektonResultAnnotations.pipelineType, pipelineType);
}

/**
 * True when the pipeline type stores its codebase inside the `APPLICATIONS_PAYLOAD`
 * PipelineRun param JSON instead of the `app.edp.epam.com/codebase` annotation.
 * Server-side CEL on the annotation would silently drop matching runs of these
 * types, so callers fall back to the client-side matchFunction.
 */
export function isCodebaseInPayloadType(activePipelineType: string | undefined): boolean {
  return activePipelineType === pipelineType.deploy || activePipelineType === pipelineType.clean;
}

export function buildCodebaseFilter(codebases: string[], activePipelineType: string | undefined): string | undefined {
  if (!codebases || codebases.length === 0) return undefined;
  if (isCodebaseInPayloadType(activePipelineType)) return undefined;
  return wrapOr(codebases.map((c) => buildAnnotationClause(tektonResultAnnotations.codebase, c)));
}
