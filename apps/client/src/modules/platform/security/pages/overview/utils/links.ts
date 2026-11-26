import type { DefectDojoFindingState, DefectDojoSeverity, OverviewNamespace } from "@my-project/shared";

/** Where the links of the overview open, and the filters the lists open with. */
export interface LinkContext {
  /** The portal cluster and the installation namespace the links open in. */
  clusterName: string;
  namespace: string;
  severity: DefectDojoSeverity | undefined;
  state: DefectDojoFindingState | undefined;
}

export function namespaceListSearch(
  { cluster, namespace }: Pick<OverviewNamespace, "cluster" | "namespace">,
  { severity, state }: LinkContext
) {
  return { cluster: [cluster], namespace, severity, state };
}

export function codebaseListSearch(codebase: string | undefined, { severity, state }: LinkContext) {
  return { codebase, severity, state };
}
