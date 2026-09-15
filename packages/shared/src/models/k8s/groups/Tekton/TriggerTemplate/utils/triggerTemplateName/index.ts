import type { GitProvider } from "../../../../KRCI/index.js";
import type { PipelineType } from "../../../Pipeline/types.js";

/** TriggerTemplate kinds the pipelines library ships per git provider. */
export type TriggerTemplateKind = Extract<PipelineType, "build" | "security">;

/**
 * Name of the TriggerTemplate the pipelines library ships per git provider:
 * `<gitProvider>-build-template`, `<gitProvider>-security-template`.
 * TriggerTemplates carry no label to select on; the name is the contract.
 * Source of truth: edp-tekton `charts/pipelines-library/templates/triggers/<provider>/tt-*.yaml`.
 * An unresolved provider yields `undefined`, never a name the apiserver rejects.
 */
export function triggerTemplateName(gitProvider: GitProvider, kind: TriggerTemplateKind): string;
export function triggerTemplateName(
  gitProvider: GitProvider | undefined,
  kind: TriggerTemplateKind
): string | undefined;
export function triggerTemplateName(
  gitProvider: GitProvider | undefined,
  kind: TriggerTemplateKind
): string | undefined {
  return gitProvider ? `${gitProvider}-${kind}-template` : undefined;
}
