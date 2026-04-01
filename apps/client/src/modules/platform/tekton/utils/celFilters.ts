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
