import z from "zod";
import { kubeObjectBaseSchema, kubeObjectMetadataSchema } from "../../../common/index.js";

export const rbacSeverityEnum = z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);

const rbacCheckSchema = z.object({
  checkID: z.string(),
  category: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  severity: rbacSeverityEnum,
  success: z.boolean(),
  messages: z.array(z.string()).optional(),
  remediation: z.string().optional(),
});

const rbacSummarySchema = z.object({
  criticalCount: z.number().default(0),
  highCount: z.number().default(0),
  mediumCount: z.number().default(0),
  lowCount: z.number().default(0),
});

const scannerSchema = z.object({
  name: z.string().optional(),
  vendor: z.string().optional(),
  version: z.string().optional(),
});

export const rbacAssessmentReportSpecSchema = z.object({
  scanner: scannerSchema.optional(),
  summary: rbacSummarySchema,
  checks: z.array(rbacCheckSchema).optional(),
});

export const rbacAssessmentReportSchema = kubeObjectBaseSchema.extend({
  metadata: kubeObjectMetadataSchema,
  report: rbacAssessmentReportSpecSchema,
});
