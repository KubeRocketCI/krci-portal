import z from "zod";
import { kubeObjectBaseSchema, kubeObjectMetadataSchema } from "../../../common/index.js";

export const exposedSecretSeverityEnum = z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);

const exposedSecretSchema = z.object({
  target: z.string(),
  ruleID: z.string(),
  title: z.string().optional(),
  category: z.string().optional(),
  severity: exposedSecretSeverityEnum,
  match: z.string().optional(),
});

const artifactSchema = z.object({
  digest: z.string().optional(),
  repository: z.string(),
  tag: z.string().optional(),
});

const registrySchema = z.object({
  server: z.string().optional(),
});

const scannerSchema = z.object({
  name: z.string().optional(),
  vendor: z.string().optional(),
  version: z.string().optional(),
});

const summarySchema = z.object({
  criticalCount: z.number().default(0),
  highCount: z.number().default(0),
  mediumCount: z.number().default(0),
  lowCount: z.number().default(0),
});

export const exposedSecretReportSpecSchema = z.object({
  artifact: artifactSchema,
  registry: registrySchema.optional(),
  scanner: scannerSchema.optional(),
  summary: summarySchema,
  updateTimestamp: z.string().optional(),
  secrets: z.array(exposedSecretSchema).optional(),
});

export const exposedSecretReportSchema = kubeObjectBaseSchema.extend({
  metadata: kubeObjectMetadataSchema,
  report: exposedSecretReportSpecSchema,
});
