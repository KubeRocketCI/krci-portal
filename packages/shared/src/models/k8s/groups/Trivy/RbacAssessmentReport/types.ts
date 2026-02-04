import z from "zod";
import { rbacAssessmentReportSchema, rbacAssessmentReportSpecSchema, rbacSeverityEnum } from "./schema.js";

export type RbacAssessmentReport = z.infer<typeof rbacAssessmentReportSchema>;

export type RbacAssessmentReportSpec = z.infer<typeof rbacAssessmentReportSpecSchema>;

export type RbacSeverity = z.infer<typeof rbacSeverityEnum>;

export interface RbacCheck {
  checkID: string;
  category?: string;
  title?: string;
  description?: string;
  severity: RbacSeverity;
  success: boolean;
  messages?: string[];
  remediation?: string;
}
