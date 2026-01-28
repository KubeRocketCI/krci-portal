import z from "zod";
import { configAuditReportSchema, configAuditReportSpecSchema, auditSeverityEnum } from "./schema.js";

export type ConfigAuditReport = z.infer<typeof configAuditReportSchema>;

export type ConfigAuditReportSpec = z.infer<typeof configAuditReportSpecSchema>;

export type AuditSeverity = z.infer<typeof auditSeverityEnum>;

export interface AuditCheck {
  checkID: string;
  category?: string;
  title?: string;
  description?: string;
  severity: AuditSeverity;
  success: boolean;
  messages?: string[];
  remediation?: string;
}
