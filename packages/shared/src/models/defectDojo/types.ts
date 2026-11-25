import type { z } from "zod";
import type {
  codebaseFindingsInputSchema,
  codebaseFindingsSchema,
  codebaseLevelSchema,
  codebaseScanRefSchema,
  codebaseScanSchema,
  findingPlaceSchema,
  findingsScopeInputSchema,
  findingsScopeSchema,
  platformFindingSchema,
  runtimeContainerRefSchema,
  runtimeContainerSchema,
  runtimeEnvironmentSchema,
  runtimeLevelSchema,
  scanFindingSchema,
  scanFindingsInputSchema,
  scanFindingsSchema,
  scanRefSchema,
  vulnerabilitiesInputSchema,
  vulnerabilitiesSchema,
} from "./schemas.js";

export type CodebaseFindingsInput = z.input<typeof codebaseFindingsInputSchema>;

/** The identity of a code or image scan. */
export type CodebaseScanRef = z.infer<typeof codebaseScanRefSchema>;

export type RuntimeContainerRef = z.infer<typeof runtimeContainerRefSchema>;

/** The identity of any scan `getScanFindings` can read. */
export type ScanRef = z.infer<typeof scanRefSchema>;

export type CodebaseScan = z.infer<typeof codebaseScanSchema>;

export type CodebaseLevel = z.infer<typeof codebaseLevelSchema>;

export type RuntimeContainer = z.infer<typeof runtimeContainerSchema>;

export type RuntimeEnvironment = z.infer<typeof runtimeEnvironmentSchema>;

export type RuntimeLevel = z.infer<typeof runtimeLevelSchema>;

export type CodebaseFindings = z.infer<typeof codebaseFindingsSchema>;

export type ScanFindingsInput = z.input<typeof scanFindingsInputSchema>;

/** The input of `getScanFindings` after its defaults are applied. */
export type ScanFindingsRequest = z.infer<typeof scanFindingsInputSchema>;

export type ScanFinding = z.infer<typeof scanFindingSchema>;

export type ScanFindings = z.infer<typeof scanFindingsSchema>;

export type FindingsScopeInput = z.input<typeof findingsScopeInputSchema>;

export type FindingsScope = z.infer<typeof findingsScopeSchema>;

export type VulnerabilitiesInput = z.input<typeof vulnerabilitiesInputSchema>;

/** The input of `getVulnerabilities` after its defaults are applied. */
export type VulnerabilitiesRequest = z.infer<typeof vulnerabilitiesInputSchema>;

export type FindingPlace = z.infer<typeof findingPlaceSchema>;

export type PlatformFinding = z.infer<typeof platformFindingSchema>;

export type Vulnerabilities = z.infer<typeof vulnerabilitiesSchema>;
