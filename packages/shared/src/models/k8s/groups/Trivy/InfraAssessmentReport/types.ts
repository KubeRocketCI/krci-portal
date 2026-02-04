import z from "zod";
import { infraAssessmentReportSchema, infraAssessmentReportSpecSchema, infraSeverityEnum } from "./schema.js";

export type InfraAssessmentReport = z.infer<typeof infraAssessmentReportSchema>;

export type InfraAssessmentReportSpec = z.infer<typeof infraAssessmentReportSpecSchema>;

export type InfraSeverity = z.infer<typeof infraSeverityEnum>;

export interface InfraCheck {
  checkID: string;
  category?: string;
  title?: string;
  description?: string;
  severity: InfraSeverity;
  success: boolean;
  messages?: string[];
  remediation?: string;
}
