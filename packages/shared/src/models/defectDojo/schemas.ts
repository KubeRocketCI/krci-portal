import { z } from "zod";
import { k8sResourceNameSchema } from "../k8s/common/schema.js";
import {
  CODEBASE_SCAN_LEVELS,
  DEFECTDOJO_FINDING_STATES,
  DEFECTDOJO_SEVERITIES,
  DEFECTDOJO_MAX_PAGE_SIZE,
  PLATFORM_LIST_DEFAULT_PAGE_SIZE,
  RUNTIME_FINDING_STATES,
  RUNTIME_REPORT_KINDS,
  RUNTIME_STATES,
  SCAN_FINDINGS_DEFAULT_PAGE_SIZE,
  SCAN_FINDINGS_MAX_PAGE,
  type SeverityCounts,
} from "./constants.js";

export const defectDojoSeveritySchema = z.enum(DEFECTDOJO_SEVERITIES);

const pagingFields = (defaultPageSize: number) => ({
  page: z.number().int().min(0).max(SCAN_FINDINGS_MAX_PAGE).default(0),
  pageSize: z.number().int().min(1).max(DEFECTDOJO_MAX_PAGE_SIZE).default(defaultPageSize),
});

const count = z.number().int().nonnegative();

/** Findings by severity. */
export const findingSeverityCountsSchema = z.object({
  Critical: count,
  High: count,
  Medium: count,
  Low: count,
  Info: count,
}) satisfies z.ZodType<SeverityCounts>;

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
  /** `noScanData` also without an Environment. */
  state: z.enum(RUNTIME_STATES),
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
  ...pagingFields(SCAN_FINDINGS_DEFAULT_PAGE_SIZE),
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

/** The installation namespace: the namespace of its Stages, Applications and Codebases. */
export const findingsScopeInputSchema = z.object({ namespace: k8sResourceNameSchema });

/** A Stage, by its CDPipeline and its `spec.name`. */
export const stageRefSchema = z.object({ cdPipeline: z.string(), stage: z.string() });

/** The most severe active finding of the one scan a level of the security line names. */
const securityLineFindingSchema = z.object({
  severity: defectDojoSeveritySchema,
  /** Active findings of that severity in that scan: never added across scans. */
  count,
});

/** A Code or Image level of the security line: the scans of the default branch. */
export const securityLineScanLevelSchema = z.discriminatedUnion("state", [
  z.object({ state: z.literal("noScanData") }),
  z.object({ state: z.literal("clean") }),
  securityLineFindingSchema.extend({ state: z.literal("data"), scanner: z.string() }),
]);

/** The Runtime level of the security line: the reports of the running containers of every Environment. */
export const securityLineRuntimeSchema = z.discriminatedUnion("state", [
  z.object({ state: z.literal("noScanData") }),
  /** Every container of every Environment is closed. */
  z.object({ state: z.literal("notRunning") }),
  z.object({ state: z.literal("clean") }),
  securityLineFindingSchema.extend({
    state: z.literal("data"),
    reportKind: z.enum(RUNTIME_REPORT_KINDS),
    environment: stageRefSchema,
  }),
]);

export const codebaseSecurityLineSchema = z.discriminatedUnion("state", [
  z.object({ state: z.literal("notConfigured") }),
  z.object({ state: z.literal("unreachable") }),
  z.object({
    state: z.literal("data"),
    levels: z.object({
      code: securityLineScanLevelSchema,
      image: securityLineScanLevelSchema,
      runtime: securityLineRuntimeSchema,
    }),
  }),
]);

/** A namespace of a Stage or of a namespace product. */
export const findingsScopeNamespaceSchema = z.object({
  cluster: z.string(),
  namespace: z.string(),
  /** The Stage that deploys to this cluster and namespace. */
  environment: stageRefSchema.nullable(),
});

const findingsScopeDataSchema = z.object({
  state: z.literal("data"),
  /** The clusters a list without `clusters` covers: the Stage clusters, or every cluster without a Stage. */
  defaultClusters: z.array(z.string()),
  /** The clusters of the installation's Stages. Empty without a Stage. */
  stageClusters: z.array(z.string()),
  /** Every cluster of a Stage or of a namespace product. */
  clusters: z.array(z.string()),
  /** Every namespace of a Stage or of a namespace product, by cluster. */
  namespaces: z.array(findingsScopeNamespaceSchema),
});

export const findingsScopeSchema = z.discriminatedUnion("state", [
  z.object({ state: z.literal("notConfigured") }),
  z.object({ state: z.literal("unreachable") }),
  findingsScopeDataSchema,
]);

/** A value of the test tag `k8s-cluster`: a tag holds no space and no comma. */
export const clusterNameSchema = z
  .string()
  .min(1)
  .max(253)
  .regex(/^[^\s,]+$/);

/** The clusters a Runtime list is scoped to. */
export const findingClustersSchema = z.array(clusterNameSchema).min(1).max(50);

/** A vulnerability id, matched exactly and case-sensitively. */
export const vulnerabilityIdSchema = z.string().trim().min(1).max(100);

/** A part of a component name, matched case-insensitively. */
export const componentSearchSchema = z.string().trim().min(1).max(255);

const listFilters = {
  namespace: k8sResourceNameSchema,
  severity: defectDojoSeveritySchema.optional(),
  ...pagingFields(PLATFORM_LIST_DEFAULT_PAGE_SIZE),
};

const runtimeScope = {
  /** Left out: the clusters of the installation's Stages, or every cluster without a Stage. */
  clusters: findingClustersSchema.optional(),
  /** One namespace, in each of the clusters. */
  workloadNamespace: k8sResourceNameSchema.optional(),
  state: z.enum(RUNTIME_FINDING_STATES).default("active"),
};

const ciScope = {
  codebase: k8sResourceNameSchema.optional(),
  state: z.enum(DEFECTDOJO_FINDING_STATES).default("active"),
};

const vulnerabilityFilters = {
  vulnerabilityId: vulnerabilityIdSchema.optional(),
  component: componentSearchSchema.optional(),
};

/** One page of the vulnerability findings of the platform. A tag or a DefectDojo id sent along is an error. */
export const vulnerabilitiesInputSchema = z.discriminatedUnion("level", [
  z.object({ level: z.literal("runtime"), ...runtimeScope, ...listFilters, ...vulnerabilityFilters }).strict(),
  z.object({ level: z.enum(CODEBASE_SCAN_LEVELS), ...ciScope, ...listFilters, ...vulnerabilityFilters }).strict(),
]);

/** One page of the secret findings of the platform, in the code or in running workloads. */
export const exposedSecretsInputSchema = z.discriminatedUnion("level", [
  z.object({ level: z.literal("runtime"), ...runtimeScope, ...listFilters }).strict(),
  z.object({ level: z.literal("code"), ...ciScope, ...listFilters }).strict(),
]);

export const findingPlaceSchema = z.discriminatedUnion("level", [
  z.object({
    level: z.literal("runtime"),
    cluster: z.string(),
    namespace: z.string(),
    /** Values of the test tags `k8s-workload` and `k8s-container`. */
    workload: z.string().nullable(),
    container: z.string().nullable(),
    /** Value of the test tag `oci-image`. */
    image: z.string().nullable(),
    /** The running image tag. Empty when the scanner reports none. */
    version: z.string(),
    environment: stageRefSchema.nullable(),
    /** The codebase that the Argo CD Application named by the test tag `app` deploys. */
    codebase: z.string().nullable(),
  }),
  z.object({
    level: z.enum(CODEBASE_SCAN_LEVELS),
    codebase: z.string(),
    branch: z.string(),
    /** The scanned image of an image scan; `null` for a code scan. */
    image: z.string().nullable(),
    /** The scanned image tag. Empty when the scanner reports none. */
    version: z.string(),
  }),
]);

/**
 * A finding of a platform list, with where it was found. `place` is `null` when its test is missing from the page or
 * lacks the tags that name the place.
 */
export const platformFindingSchema = scanFindingSchema.extend({ place: findingPlaceSchema.nullable() });

export const platformFindingsListSchema = z.discriminatedUnion("state", [
  z.object({ state: z.literal("notConfigured") }),
  z.object({ state: z.literal("unreachable") }),
  z.object({ state: z.literal("noScanData") }),
  z.object({
    state: z.literal("data"),
    /**
     * Findings of the whole filter, not of this page. A triaged Runtime list counts the findings of open tests among
     * the `TRIAGED_RUNTIME_SCAN_LIMIT` most severe.
     */
    total: count,
    findings: z.array(platformFindingSchema),
    /** A triaged Runtime list holds more findings than `TRIAGED_RUNTIME_SCAN_LIMIT`: these are its most severe. */
    truncated: z.boolean(),
  }),
]);

/** The Runtime part of the Security overview: the installation namespace, and the state the counts hold. */
export const securityOverviewInputSchema = z
  .object({ namespace: k8sResourceNameSchema, state: runtimeScope.state })
  .strict();

/** The Code and Image part of the Security overview. A fixed finding of a CI scan is mitigated: Mitigated is a state. */
export const securityOverviewCodebasesInputSchema = z
  .object({ namespace: k8sResourceNameSchema, state: ciScope.state })
  .strict();

/** The findings of a namespace product, the exposed secrets apart: its DefectDojo count holds both. */
export const namespaceProductCountsSchema = z.object({
  url: z.string(),
  /** Findings of the state, the exposed secrets left out. */
  vulnerabilities: findingSeverityCountsSchema,
  secrets: findingSeverityCountsSchema,
});

/** A namespace option of the scope, with the counts of its namespace product. */
export const overviewNamespaceSchema = findingsScopeNamespaceSchema.extend({
  /** The namespace product carries the tenant tag of the installation namespace. */
  managed: z.boolean(),
  /** `null`: DefectDojo holds no namespace product for it, as for a Stage the security operator does not cover. */
  product: namespaceProductCountsSchema.nullable(),
});

export const securityOverviewSchema = z.discriminatedUnion("state", [
  z.object({ state: z.literal("notConfigured") }),
  z.object({ state: z.literal("unreachable") }),
  z.object({ state: z.literal("noScanData") }),
  findingsScopeDataSchema.extend({
    /** In the order of `compareOverviewNamespaces`. */
    namespaces: z.array(overviewNamespaceSchema),
    /** More exposed secrets than `TRIAGED_RUNTIME_SCAN_LIMIT`: the ones not read count as vulnerabilities. */
    secretsTruncated: z.boolean(),
  }),
]);

/** A Code or Image scan of the overview: the newest test of its codebase, branch, scanner and image. */
export const overviewScanSchema = z.object({
  ref: codebaseScanRefSchema,
  /** `null`: the caller may not list the CodebaseImageStreams, so whose image it is is not known. */
  ownImage: z.boolean().nullable(),
  version: z.string(),
  date: z.string(),
  testUrl: z.string(),
  counts: findingSeverityCountsSchema,
});

export const overviewCodebaseSchema = z.object({
  /** Value of the test tag `app.edp.epam.com/codebase`. */
  codebase: z.string(),
  /** The caller can read a Codebase of that name in the installation namespace; `false` when the caller may not list them. */
  known: z.boolean(),
  scans: z.array(overviewScanSchema),
});

export const securityOverviewCodebasesSchema = z.discriminatedUnion("state", [
  z.object({ state: z.literal("notConfigured") }),
  z.object({ state: z.literal("unreachable") }),
  z.object({
    state: z.literal("noScanData"),
    /** The Codebases the caller can read: none has a scan. */
    unscanned: z.array(z.string()),
  }),
  z.object({
    state: z.literal("data"),
    codebases: z.array(overviewCodebaseSchema),
    /** The Codebases the caller can read that have no scan: no CI test, or tests of deleted branches only. */
    unscanned: z.array(z.string()),
  }),
]);

/** The Stage of an Environment as the route of the Stage page names it. The server reads every tag from the Stage. */
export const environmentSummaryInputSchema = z
  .object({ namespace: k8sResourceNameSchema, cdPipeline: k8sResourceNameSchema, stage: k8sResourceNameSchema })
  .strict();

const environmentContainerBase = runtimeContainerBase.pick({ workload: true, container: true, image: true });

/** A workload container of an Environment with the active findings of its open tests. */
export const environmentContainerSchema = z.discriminatedUnion("state", [
  environmentContainerBase.extend({
    state: z.literal("running"),
    /** `null`: no open VulnerabilityReport test. */
    vulnerabilities: findingSeverityCountsSchema.nullable(),
    /** Active findings of the open ExposedSecretReport test; `null`: no such test. Never added to the vulnerabilities. */
    secrets: count.nullable(),
  }),
  /** Every test of the container is closed: no counts. */
  environmentContainerBase.extend({ state: z.literal("notRunning") }),
]);

/** The workloads of one codebase in the Environment: those of its Application, the first by name. */
export const environmentApplicationSchema = z.object({
  /** The Application label `app.edp.epam.com/app-name`. */
  codebase: z.string(),
  state: z.enum(RUNTIME_STATES),
  containers: z.array(environmentContainerSchema),
});

/** The namespace product of an Environment. */
export const environmentRuntimeSchema = z.discriminatedUnion("state", [
  /** Every runtime test of the namespace is closed. */
  z.object({ state: z.literal("notRunning"), url: z.string() }),
  z.object({ state: z.literal("clean"), url: z.string(), lastUpload: z.string() }),
  namespaceProductCountsSchema.extend({
    state: z.literal("data"),
    /** More exposed secrets than `TRIAGED_RUNTIME_SCAN_LIMIT`: the ones not read count as vulnerabilities. */
    secretsTruncated: z.boolean(),
    /** Last upload of an open runtime test of the namespace. */
    lastUpload: z.string(),
  }),
]);

/** The pair a platform list filters by: a namespace and its cluster in the case of the `k8s-cluster` tag. */
export const namespacePlaceSchema = z.object({ cluster: z.string(), namespace: z.string() });

export const environmentSummarySchema = z.discriminatedUnion("state", [
  z.object({ state: z.literal("notConfigured") }),
  z.object({ state: z.literal("unreachable") }),
  /** No runtime test of the namespace: the security operator has not reported it. */
  z.object({ state: z.literal("noScanData") }),
  z.object({
    state: z.literal("data"),
    /** Where the Stage runs. */
    place: namespacePlaceSchema,
    runtime: environmentRuntimeSchema,
    containers: z.object({
      /** Running workload containers of the namespace. */
      scanned: count,
      /** Running containers whose `app` tag names no Application with a codebase label. `null`: Applications not listed. */
      withoutCodebase: count.nullable(),
      notRunning: count,
    }),
    /** One per codebase of the Stage's Applications, by codebase. `null`: no access, or the type is not served. */
    applications: z.array(environmentApplicationSchema).nullable(),
  }),
]);
