import z from "zod";
import { kubeObjectBaseSchema, kubeObjectMetadataSchema } from "../../../common/index.js";

export const auditSeverityEnum = z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);

const auditCheckSchema = z.object({
  checkID: z.string(),
  category: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  severity: auditSeverityEnum,
  success: z.boolean(),
  messages: z.array(z.string()).optional(),
  remediation: z.string().optional(),
});

const auditSummarySchema = z.object({
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

export const configAuditReportSpecSchema = z.object({
  scanner: scannerSchema.optional(),
  summary: auditSummarySchema,
  updateTimestamp: z.string().optional(),
  checks: z.array(auditCheckSchema).optional(),
});

export const configAuditReportSchema = kubeObjectBaseSchema.extend({
  metadata: kubeObjectMetadataSchema,
  report: configAuditReportSpecSchema,
});
