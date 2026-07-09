import { ValueOf } from "@/core/types/global";
import { auditEventFilterControlNames } from "./constants";

export type AuditEventFilterNames = ValueOf<typeof auditEventFilterControlNames>;

export type AuditEventListFilterValues = {
  [auditEventFilterControlNames.KIND]: string;
  [auditEventFilterControlNames.NAMESPACE]: string;
  [auditEventFilterControlNames.OPERATION]: string;
  [auditEventFilterControlNames.ACTOR]: string;
  [auditEventFilterControlNames.FROM]: string;
  [auditEventFilterControlNames.TO]: string;
};
