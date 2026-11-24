import { z } from "zod";
import { k8sResourceNameSchema } from "../k8s/common/schema.js";
import {
  CODEBASE_SCAN_LEVELS,
  DEFECTDOJO_SEVERITIES,
  DEFECTDOJO_MAX_PAGE_SIZE,
  RUNTIME_REPORT_KINDS,
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

/**
 * Typed identity of one report of a workload container in an Environment. The server resolves its test.
 * Strict: a tag or a DefectDojo id sent along is an error.
 */
export const runtimeContainerRefSchema = z
  .object({
    level: z.literal("runtime"),
    /** `spec.cdPipeline` of the Stage. */
    cdPipeline: k8sResourceNameSchema,
    /** `spec.name` of the Stage. */
    stage: k8sResourceNameSchema,
    /** Value of the test tag `k8s-workload`, sent back as received. */
    workload: z.string().min(1).max(255),
    /** Value of the test tag `k8s-container`, sent back as received. */
    container: z.string().min(1).max(255),
    reportKind: z.enum(RUNTIME_REPORT_KINDS),
  })
  .strict();

export const scanRefSchema = z.discriminatedUnion("level", [codebaseScanRefSchema, runtimeContainerRefSchema]);

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

const runtimeVulnerabilitiesSchema = z.object({
  /** Active findings of the VulnerabilityReport test, by severity. */
  counts: findingSeverityCountsSchema,
  triaged: count,
  testUrl: z.string(),
});

const runtimeSecretsSchema = z.object({
  /** Active findings of the ExposedSecretReport test. Never added to the severity counts. */
  active: count,
  triaged: count,
  testUrl: z.string(),
});

const runtimeContainerBase = z.object({
  workload: z.string(),
  container: z.string(),
  /** Value of the test tag `oci-image`. */
  image: z.string().nullable(),
  ownImage: z.boolean(),
  productUrl: z.string(),
});

export const runtimeContainerSchema = z.discriminatedUnion("state", [
  runtimeContainerBase.extend({
    state: z.literal("running"),
    /** The running image tag. Empty when the scanner reports none. */
    version: z.string(),
    /** Last upload of the container's open tests. */
    date: z.string(),
    /** `null`: no open VulnerabilityReport test. */
    vulnerabilities: runtimeVulnerabilitiesSchema.nullable(),
    /** `null`: no open ExposedSecretReport test. */
    secrets: runtimeSecretsSchema.nullable(),
  }),
  /** Every test of the container is closed: no counts, tag or date. */
  runtimeContainerBase.extend({ state: z.literal("notRunning") }),
]);

export const runtimeEnvironmentSchema = z.object({
  cdPipeline: z.string(),
  stage: z.string(),
  clusterName: z.string(),
  namespace: z.string(),
  /** Empty: no runtime test of the Environment. */
  containers: z.array(runtimeContainerSchema),
});

export const runtimeLevelSchema = z.object({
  /**
   * `noScanData`: no container in any Environment, also no Environment.
   * `notRunning`: containers exist and none is running.
   * `clean`: running containers, none with an active finding or secret.
   */
  state: z.enum(["noScanData", "notRunning", "clean", "data"]),
  environments: z.array(runtimeEnvironmentSchema),
  /** Latest `date` of a running container. `null` without one. */
  lastUpload: z.string().nullable(),
});

export const codebaseFindingsSchema = z.discriminatedUnion("state", [
  z.object({ state: z.literal("notConfigured") }),
  z.object({ state: z.literal("unreachable") }),
  z.object({
    state: z.literal("data"),
    levels: z.object({ code: codebaseLevelSchema, image: codebaseLevelSchema, runtime: runtimeLevelSchema }),
  }),
]);

export const scanFindingsInputSchema = codebaseFindingsInputSchema.extend({
  scan: scanRefSchema,
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
