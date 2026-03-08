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

/** Build a CEL label equality clause: `data.metadata.labels['key'] == 'value'` */
function buildLabelClause(labelKey: string, value: string): string {
  return `data.metadata.labels['${labelKey}'] == '${escapeCELString(value)}'`;
}

// ---------------------------------------------------------------------------
// Generic label-to-CEL builder (NO data_type clause).
// Used by useUnifiedPipelineRunList to auto-derive CEL from K8s label selectors.
// ---------------------------------------------------------------------------

/**
 * Build a combined CEL filter from a labels record.
 * Each entry becomes `data.metadata.labels['key'] == 'value'`, joined with ` && `.
 * Returns undefined when the labels record is empty.
 *
 * The same label keys used for K8s watch selectors work here because
 * Tekton Results stores the full PipelineRun, so `data.metadata.labels`
 * contains the same labels as the live K8s resource.
 */
export function buildLabelsFilter(labels: Record<string, string>): string | undefined {
  const entries = Object.entries(labels);
  if (entries.length === 0) return undefined;
  return entries.map(([key, value]) => buildLabelClause(key, value)).join(" && ");
}

// ---------------------------------------------------------------------------
// Full CEL filters (include data_type clause).
// Used with listRecords where data_type is NOT appended automatically.
// ---------------------------------------------------------------------------

export const buildPipelineRunNameFilter = (pipelineRunName: string): string => {
  return `data.metadata.name == '${escapeCELString(pipelineRunName)}' && ${PIPELINE_RUN_DATA_TYPE}`;
};
