/**
 * Security summary API types, inferred from the Zod schemas.
 */

import { z } from "zod";
import {
  securityCiSummarySchema,
  securityCodebaseSummarySchema,
  securityCountsSchema,
  securityEnvironmentApplicationSchema,
  securityEnvironmentOtherSchema,
  securityEnvironmentSummarySchema,
  securityFindingSchema,
  securityFindingsPageSchema,
  securityListFindingsInputSchema,
  securityRuntimeSummarySchema,
  securityScopeSchema,
  securitySeveritySchema,
} from "./schemas.js";

export type SecuritySeverity = z.infer<typeof securitySeveritySchema>;
export type SecurityScope = z.infer<typeof securityScopeSchema>;
export type SecurityCounts = z.infer<typeof securityCountsSchema>;
export type SecurityCiSummary = z.infer<typeof securityCiSummarySchema>;
export type SecurityRuntimeSummary = z.infer<typeof securityRuntimeSummarySchema>;
export type SecurityCodebaseSummary = z.infer<typeof securityCodebaseSummarySchema>;
export type SecurityEnvironmentApplication = z.infer<typeof securityEnvironmentApplicationSchema>;
export type SecurityEnvironmentOther = z.infer<typeof securityEnvironmentOtherSchema>;
export type SecurityEnvironmentSummary = z.infer<typeof securityEnvironmentSummarySchema>;
export type SecurityFinding = z.infer<typeof securityFindingSchema>;
export type SecurityFindingsPage = z.infer<typeof securityFindingsPageSchema>;
export type SecurityListFindingsInput = z.infer<typeof securityListFindingsInputSchema>;
