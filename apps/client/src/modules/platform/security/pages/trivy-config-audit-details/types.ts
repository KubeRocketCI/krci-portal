import { AuditCheck } from "@my-project/shared";

export interface AuditCheckWithId extends AuditCheck {
  /**
   * Unique identifier for the check (combination of checkID and index)
   */
  id: string;
}
