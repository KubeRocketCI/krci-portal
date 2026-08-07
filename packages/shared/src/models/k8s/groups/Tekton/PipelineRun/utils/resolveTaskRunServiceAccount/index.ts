import { pipelineAnnotations } from "../../../Pipeline/annotations.js";
import { Pipeline } from "../../../Pipeline/types.js";
import { TriggerTemplate } from "../../../TriggerTemplate/types.js";

/** Anchored: a composite "$(tt.params.a)-$(tt.params.b)" is two references, and
 *  group 1 would capture a bogus param name. */
export const WHOLE_TT_PARAM_RE = /^\$\(tt\.params\.([^)]+)\)$/;

/** Structural rather than `PipelineRun`, so both it and `PipelineRunDraft` satisfy it. */
type TaskRunServiceAccountHost = {
  spec?: { taskRunTemplate?: { serviceAccountName?: string } };
};

const nonEmpty = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed === "" ? undefined : trimmed;
};

/**
 * Precedence deliberately mirrors the krci Tekton interceptor: a run started
 * from the portal must land on the same ServiceAccount a webhook would pick.
 */
export function resolveServiceAccountName({
  pipeline,
  triggerTemplate,
  paramName,
}: {
  pipeline?: Pipeline;
  triggerTemplate?: TriggerTemplate;
  paramName?: string;
}): string | undefined {
  const fromAnnotation = nonEmpty(pipeline?.metadata?.annotations?.[pipelineAnnotations.serviceAccount]);

  if (fromAnnotation) {
    return fromAnnotation;
  }

  if (!paramName) {
    return undefined;
  }

  return nonEmpty(triggerTemplate?.spec?.params?.find((param) => param.name === paramName)?.default);
}

/**
 * Only placeholders are rewritten: a concrete value (`tekton-cd`, `tekton-security`,
 * plain `tekton` pre-hardening) is the chart pinning the account, which the webhook
 * flow would not override either. An unresolvable placeholder is deleted rather than
 * left — sent as-is it becomes a ServiceAccount name and fails every TaskRun.
 */
export function applyTaskRunServiceAccount(
  draft: TaskRunServiceAccountHost,
  {
    pipeline,
    triggerTemplate,
  }: {
    pipeline?: Pipeline;
    triggerTemplate?: TriggerTemplate;
  }
): void {
  const spec = draft?.spec;
  const taskRunTemplate = spec?.taskRunTemplate;

  if (!spec || !taskRunTemplate) {
    return;
  }

  const current = nonEmpty(taskRunTemplate.serviceAccountName);
  const placeholder = current && WHOLE_TT_PARAM_RE.exec(current);

  if (!placeholder) {
    return;
  }

  const resolved = resolveServiceAccountName({ pipeline, triggerTemplate, paramName: placeholder[1] });

  if (resolved) {
    taskRunTemplate.serviceAccountName = resolved;

    return;
  }

  delete taskRunTemplate.serviceAccountName;

  // `taskRunTemplate: {}` would be visible noise in the "Build with params" editor
  // and in `krci pipelinerun start --dry-run`.
  if (Object.keys(taskRunTemplate).length === 0) {
    delete spec.taskRunTemplate;
  }
}
