import z from "zod";
import { kubeObjectBaseSchema, kubeObjectMetadataSchema } from "../../../common/index.js";

export const infraSeverityEnum = z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);

const infraCheckSchema = z.object({
  checkID: z.string(),
  category: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  severity: infraSeverityEnum,
  success: z.boolean(),
  messages: z.array(z.string()).optional(),
  remediation: z.string().optional(),
});

const infraSummarySchema = z.object({
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

export const infraAssessmentReportSpecSchema = z.object({
  scanner: scannerSchema.optional(),
  summary: infraSummarySchema,
  updateTimestamp: z.string().optional(),
  checks: z.array(infraCheckSchema).optional(),
});

export const infraAssessmentReportSchema = kubeObjectBaseSchema.extend({
  metadata: kubeObjectMetadataSchema,
  report: infraAssessmentReportSpecSchema,
});
