import { MatchFunctions } from "@/core/providers/Filter";
import type { KrciAuditEvent } from "@my-project/shared";
import type { AuditEventListFilterValues } from "./types";

export const auditEventFilterControlNames = {
  KIND: "kind",
  NAMESPACE: "namespace",
  OPERATION: "operation",
  ACTOR: "actor",
  FROM: "from",
  TO: "to",
} as const;

export const defaultAuditEventFilterValues: AuditEventListFilterValues = {
  [auditEventFilterControlNames.KIND]: "",
  [auditEventFilterControlNames.NAMESPACE]: "",
  [auditEventFilterControlNames.OPERATION]: "all",
  [auditEventFilterControlNames.ACTOR]: "",
  [auditEventFilterControlNames.FROM]: "",
  [auditEventFilterControlNames.TO]: "",
};

export const auditOperationValues = ["CREATE", "UPDATE", "DELETE", "CONNECT"] as const;

// Intentionally no-ops: filtering is done server-side by krci-audit, so the DataTable
// must NOT re-filter the already-filtered page it receives.
export const matchFunctions: MatchFunctions<KrciAuditEvent, AuditEventListFilterValues> = {
  [auditEventFilterControlNames.KIND]: () => true,
  [auditEventFilterControlNames.NAMESPACE]: () => true,
  [auditEventFilterControlNames.OPERATION]: () => true,
  [auditEventFilterControlNames.ACTOR]: () => true,
  [auditEventFilterControlNames.FROM]: () => true,
  [auditEventFilterControlNames.TO]: () => true,
};
