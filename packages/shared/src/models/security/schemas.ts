/**
 * Security summary API Zod schemas.
 *
 * The portal reads DefectDojo on the server and returns one summary per codebase and per
 * environment (CD pipeline Stage), plus a findings list.
 */

import { z } from "zod";
import {
  SECURITY_CI_KINDS,
  SECURITY_FINDINGS_PAGE_MAX,
  SECURITY_FINDINGS_PAGE_SIZE_DEFAULT,
  SECURITY_FINDINGS_PAGE_SIZE_MAX,
  SECURITY_SCOPES,
  SECURITY_SEVERITIES,
  SECURITY_STATUSES,
} from "./constants.js";

// =============================================================================
// Shared building blocks
// =============================================================================

export const securitySeveritySchema = z.enum(SECURITY_SEVERITIES);
export const securityScopeSchema = z.enum(SECURITY_SCOPES);
export const securityStatusSchema = z.enum(SECURITY_STATUSES);
export const securityCiKindSchema = z.enum(SECURITY_CI_KINDS);

/** Findings per severity among the active, non-duplicate findings. */
export const securityCountsSchema = z.object({
  critical: z.number().int().nonnegative(),
  high: z.number().int().nonnegative(),
  medium: z.number().int().nonnegative(),
  low: z.number().int().nonnegative(),
  unassigned: z.number().int().nonnegative(),
});

const DNS_LABEL_PATTERN = "[a-z0-9]([-a-z0-9]*[a-z0-9])?";

/** Kubernetes resource name (RFC 1123 label), safe to use as a path segment and a query value. */
const securityResourceNameSchema = z
  .string()
  .min(1)
  .max(63)
  .regex(new RegExp(`^${DNS_LABEL_PATTERN}$`), "Invalid Kubernetes resource name");

// =============================================================================
// Codebase summary
// =============================================================================

export const securityCodebaseSummaryInputSchema = z.object({
  codebase: securityResourceNameSchema.describe("Codebase (KubeRocketCI Codebase CR) name."),
});

export const securityCiSummarySchema = z.object({
  kind: securityCiKindSchema,
  engagement: z.string(),
  branch: z.string().optional(),
  image: z.string().optional(),
  tag: z.string().optional(),
  tools: z.array(z.string()),
  counts: securityCountsSchema,
  updated: z.string().optional(),
  link: z.string(),
});

export const securityRuntimeSummarySchema = z.object({
  environment: z.string().describe("`<cdPipeline>/<stage>`"),
  workloads: z.array(z.string()),
  versions: z.array(z.string()),
  tools: z.array(z.string()),
  counts: securityCountsSchema,
  updated: z.string().optional(),
  link: z.string(),
});

export const securityCodebaseSummarySchema = z.object({
  status: securityStatusSchema,
  codebase: z.string(),
  ci: z.array(securityCiSummarySchema),
  runtime: z.array(securityRuntimeSummarySchema),
  link: z.string().optional(),
});

// =============================================================================
// Environment summary
// =============================================================================

export const securityEnvironmentSummaryInputSchema = z.object({
  cdPipeline: securityResourceNameSchema.describe("CDPipeline name."),
  stage: securityResourceNameSchema.describe("Stage name within the CDPipeline."),
});

export const securityEnvironmentApplicationSchema = z.object({
  codebase: z.string(),
  workloads: z.array(z.string()),
  versions: z.array(z.string()),
  counts: securityCountsSchema,
  updated: z.string().optional(),
  link: z.string(),
});

/** Workloads of the environment whose image belongs to no codebase of the tenant. */
export const securityEnvironmentOtherSchema = z.object({
  counts: securityCountsSchema,
  workloads: z.array(z.string()),
  updated: z.string().optional(),
  link: z.string(),
});

export const securityEnvironmentSummarySchema = z.object({
  status: securityStatusSchema,
  environment: z.string().describe("`<cdPipeline>/<stage>`"),
  applications: z.array(securityEnvironmentApplicationSchema),
  other: securityEnvironmentOtherSchema.optional(),
});

// =============================================================================
// Findings
// =============================================================================

export const securityListFindingsInputSchema = z.object({
  codebase: securityResourceNameSchema.describe("Codebase (KubeRocketCI Codebase CR) name."),
  scope: securityScopeSchema.describe(
    "CI or runtime findings. Runtime findings are those of tests tagged with the tenant of the portal."
  ),
  environment: z
    .string()
    .max(127)
    .regex(new RegExp(`^${DNS_LABEL_PATTERN}/${DNS_LABEL_PATTERN}$`), "environment must be <cdPipeline>/<stage>")
    .optional()
    .describe("Only the runtime findings of `<cdPipeline>/<stage>`."),
  severity: z.array(securitySeveritySchema).optional().describe("Only these severities."),
  page: z
    .number()
    .int()
    .min(1)
    .max(SECURITY_FINDINGS_PAGE_MAX)
    .optional()
    .default(1)
    .describe(`1-based page number, at most ${SECURITY_FINDINGS_PAGE_MAX}.`),
  pageSize: z
    .number()
    .int()
    .min(1)
    .max(SECURITY_FINDINGS_PAGE_SIZE_MAX)
    .optional()
    .default(SECURITY_FINDINGS_PAGE_SIZE_DEFAULT),
});

export const securityFindingSchema = z.object({
  id: z.number().int(),
  severity: securitySeveritySchema,
  title: z.string(),
  vulnId: z.string().optional(),
  component: z.string(),
  version: z.string(),
  fixedVersion: z.string().optional(),
  scope: securityScopeSchema,
  environment: z.string().optional(),
  workload: z.string().optional(),
  branch: z.string().optional(),
  engagement: z.string(),
  link: z.string(),
});

export const securityFindingsPageSchema = z.object({
  status: securityStatusSchema,
  items: z.array(securityFindingSchema),
  totalCount: z.number().int().nonnegative(),
  page: z.number().int(),
  pageSize: z.number().int(),
});
