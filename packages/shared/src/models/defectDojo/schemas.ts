import { z } from "zod";
import { k8sResourceNameSchema } from "../k8s/common/schema.js";
import {
  CODEBASE_SCAN_LEVELS,
  DEFECTDOJO_SEVERITIES,
  DEFECTDOJO_MAX_PAGE_SIZE,
  SCAN_FINDINGS_DEFAULT_PAGE_SIZE,
  SCAN_FINDINGS_MAX_PAGE,
  type DefectDojoSeverity,
} from "./constants.js";

export const defectDojoSeveritySchema = z.enum(DEFECTDOJO_SEVERITIES);

const count = z.number().int().nonnegative();

/** Findings by severity. */
export const findingSeverityCountsSchema = z.object({
  Critical: count,
  High: count,
  Medium: count,
  Low: count,
  Info: count,
}) satisfies z.ZodType<Record<DefectDojoSeverity, number>>;

/** The codebase whose findings are read. The server derives every DefectDojo lookup from it. */
export const codebaseFindingsInputSchema = z.object({
  namespace: k8sResourceNameSchema,
  name: k8sResourceNameSchema,
});

/** Typed identity of one scan: the server resolves its DefectDojo test from it. Sent back as received. */
export const codebaseScanRefSchema = z.object({
  level: z.enum(CODEBASE_SCAN_LEVELS),
  branch: z.string().min(1).max(255),
  scanner: z.string().min(1).max(100),
  /** The scanned image of an image scan; `null` for a code scan. */
  image: z.string().min(1).max(500).nullable(),
});

export const codebaseScanSchema = z.object({
  ref: codebaseScanRefSchema,
  /** The image is built from the codebase, not one of the third-party images of its chart. */
  ownImage: z.boolean(),
  /** Image tag that was scanned. Empty when the scanner reports none. */
  version: z.string(),
  /** Last upload of the scan. */
  date: z.string(),
  /** Active findings of this scan. Never added to the counts of another scan. */
  counts: findingSeverityCountsSchema,
  /** Findings that are not active: mitigated, false positive, out of scope, risk accepted. */
  triaged: count,
  testUrl: z.string(),
  productUrl: z.string(),
});

export const codebaseLevelSchema = z.object({
  /** `noScanData`: no scan of the level. `clean`: scans without an active finding. */
  state: z.enum(["noScanData", "clean", "data"]),
  /** Scans of the level: the default branch first, the own image before third-party images. */
  scans: z.array(codebaseScanSchema),
  /** Last upload of the level's scans. `null` without scans. */
  lastUpload: z.string().nullable(),
});

export const codebaseFindingsSchema = z.discriminatedUnion("state", [
  z.object({ state: z.literal("notConfigured") }),
  z.object({ state: z.literal("unreachable") }),
  z.object({
    state: z.literal("data"),
    levels: z.object({ code: codebaseLevelSchema, image: codebaseLevelSchema }),
  }),
]);

export const scanFindingsInputSchema = codebaseFindingsInputSchema.extend({
  scan: codebaseScanRefSchema,
  severity: defectDojoSeveritySchema.optional(),
  /** Also list the mitigated, false positive, out of scope and risk accepted findings. */
  showTriaged: z.boolean().default(false),
  page: z.number().int().min(0).max(SCAN_FINDINGS_MAX_PAGE).default(0),
  pageSize: z.number().int().min(1).max(DEFECTDOJO_MAX_PAGE_SIZE).default(SCAN_FINDINGS_DEFAULT_PAGE_SIZE),
});

/** A finding with the fields the tab shows. */
export const scanFindingSchema = z.object({
  title: z.string(),
  severity: defectDojoSeveritySchema,
  active: z.boolean(),
  mitigated: z.boolean(),
  falsePositive: z.boolean(),
  outOfScope: z.boolean(),
  riskAccepted: z.boolean(),
  underReview: z.boolean(),
  date: z.string().nullable(),
  componentName: z.string().nullable(),
  componentVersion: z.string().nullable(),
  vulnerabilityIds: z.array(z.string()),
  filePath: z.string().nullable(),
  line: z.number().int().nullable(),
  /** `null`: the scanner does not say. */
  fixAvailable: z.boolean().nullable(),
  /** Only where the scanner fills it. */
  fixVersion: z.string().nullable(),
  url: z.string(),
});

export const scanFindingsSchema = z.discriminatedUnion("state", [
  z.object({ state: z.literal("notConfigured") }),
  z.object({ state: z.literal("unreachable") }),
  z.object({ state: z.literal("noScanData") }),
  z.object({
    state: z.literal("data"),
    /** Findings of the whole filter, not of this page. */
    total: count,
    findings: z.array(scanFindingSchema),
  }),
]);
