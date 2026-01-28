import z from "zod";
import { kubeObjectBaseSchema, kubeObjectMetadataSchema } from "../../../common/index.js";

export const complianceSeverityEnum = z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);

const commandSchema = z.object({
  id: z.string(),
});

const checkSchema = z.object({
  id: z.string(),
});

export const controlCheckSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  severity: complianceSeverityEnum,
  checks: z.array(checkSchema).optional(),
  commands: z.array(commandSchema).optional(),
});

export const controlResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  severity: complianceSeverityEnum,
  totalFail: z.number().optional(),
});

export const complianceSpecSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  type: z.string(),
  platform: z.string().optional(),
  version: z.string().optional(),
  relatedResources: z.array(z.string()).optional(),
  controls: z.array(controlCheckSchema).optional(),
});

export const statusSummarySchema = z.object({
  passCount: z.number().default(0),
  failCount: z.number().nullable().default(0),
});

const summaryReportSchema = z.object({
  controlCheck: z.array(controlResultSchema).optional(),
});

const clusterComplianceReportSpecSchema = z.object({
  compliance: complianceSpecSchema,
  cron: z.string().optional(),
  reportType: z.string().optional(),
});

const clusterComplianceReportStatusSchema = z.object({
  summary: statusSummarySchema.optional(),
  summaryReport: summaryReportSchema.optional(),
  updateTimestamp: z.string().optional(),
});

export const clusterComplianceReportSchema = kubeObjectBaseSchema.extend({
  metadata: kubeObjectMetadataSchema,
  spec: clusterComplianceReportSpecSchema,
  status: clusterComplianceReportStatusSchema.optional(),
});
