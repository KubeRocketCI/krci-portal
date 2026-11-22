// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
// Joins of the platform Security pages. Every join is an exact match on an explicit value.
import {
  PROTOTYPE_DEFECTDOJO_TAG_KEY,
  type PrototypeDefectDojoLevel,
  type PrototypeDefectDojoProduct,
  type PrototypeDefectDojoScopeCounts,
  type PrototypeDefectDojoSeverityCounts,
  type PrototypeDefectDojoTest,
} from "@my-project/shared";
import { getTagValue, sumSeverityCounts } from "../utils";
import type { CodebaseRow, NamespaceRow, PlatformScope, PlatformStage } from "./types";

export function clusterTag(cluster: string): string {
  return `${PROTOTYPE_DEFECTDOJO_TAG_KEY.cluster}:${cluster}`;
}

export function namespaceTag(namespace: string): string {
  return `${PROTOTYPE_DEFECTDOJO_TAG_KEY.namespace}:${namespace}`;
}

export function tenantTag(scope: PlatformScope): string {
  return `${PROTOTYPE_DEFECTDOJO_TAG_KEY.tenant}:${scope.installationNamespace}`;
}

export function codebaseTag(codebaseName: string): string {
  return `${PROTOTYPE_DEFECTDOJO_TAG_KEY.codebase}:${codebaseName}`;
}

/** Distinct `Stage.spec.clusterName` of the installation. */
export function installationClusters(scope: PlatformScope): string[] {
  return [...new Set(scope.stages.map((stage) => stage.clusterName))].sort();
}

/** The Stage whose cluster and namespace equal the given values. */
export function findStage(scope: PlatformScope, cluster: string, namespace: string): PlatformStage | null {
  return scope.stages.find((stage) => stage.clusterName === cluster && stage.namespace === namespace) ?? null;
}

/**
 * Namespace products: the products that carry a `k8s-cluster` and a `k8s-namespace` tag.
 * `managed`: the product carries the tenant tag of the installation.
 */
export function buildNamespaceRows(scope: PlatformScope, products: PrototypeDefectDojoProduct[]): NamespaceRow[] {
  const tenant = tenantTag(scope).toLowerCase();
  const rows: NamespaceRow[] = [];

  for (const product of products) {
    const cluster = getTagValue(product.tags, PROTOTYPE_DEFECTDOJO_TAG_KEY.cluster);
    const namespace = getTagValue(product.tags, PROTOTYPE_DEFECTDOJO_TAG_KEY.namespace);
    if (cluster === null || namespace === null) {
      continue;
    }
    rows.push({
      product,
      cluster,
      namespace,
      managed: product.tags.includes(tenant),
      stage: findStage(scope, cluster, namespace),
      counts: null,
    });
  }

  return rows;
}

/** Codebase products from the CI tests tagged with the installation namespace, one row per codebase tag value. */
export function buildCodebaseRows(scope: PlatformScope, tests: PrototypeDefectDojoTest[]): CodebaseRow[] {
  const rows = new Map<string, CodebaseRow>();

  for (const test of tests) {
    const codebaseName = getTagValue(test.tags, PROTOTYPE_DEFECTDOJO_TAG_KEY.codebase);
    if (codebaseName === null || (test.level !== "code" && test.level !== "image")) {
      continue;
    }

    const row = rows.get(codebaseName);
    if (row) {
      row.tests.push(test);
    } else {
      rows.set(codebaseName, {
        codebaseName,
        product: test.product,
        known: scope.codebases.includes(codebaseName),
        tests: [test],
      });
    }
  }

  return [...rows.values()].sort((left, right) => left.codebaseName.localeCompare(right.codebaseName));
}

export interface ScanTypeTotal {
  scanType: string;
  level: PrototypeDefectDojoLevel;
  /** Number of tests of the scan type. */
  scans: number;
  /** Sum over the tests of this one scan type. `null`: a count is missing. */
  counts: PrototypeDefectDojoSeverityCounts | null;
}

/**
 * Totals per scan type over all codebases. Two scan types are never added: Trivy Scan and
 * Anchore Grype report the same image.
 */
export function scanTypeTotals(
  codebases: CodebaseRow[],
  testCounts: Map<number, PrototypeDefectDojoScopeCounts>
): ScanTypeTotal[] {
  const byScanType = new Map<string, { level: PrototypeDefectDojoLevel; tests: PrototypeDefectDojoTest[] }>();
  for (const codebase of codebases) {
    for (const test of codebase.tests) {
      if (test.level === null) {
        continue;
      }
      const entry = byScanType.get(test.scanType) ?? { level: test.level, tests: [] };
      entry.tests.push(test);
      byScanType.set(test.scanType, entry);
    }
  }

  return [...byScanType.entries()].map(([scanType, entry]) => ({
    scanType,
    level: entry.level,
    scans: entry.tests.length,
    counts: sumSeverityCounts(entry.tests.map((test) => testCounts.get(test.id)?.active ?? null)),
  }));
}

/** Most severe first: by critical, then high, then total. Rows without counts last. */
export function compareBySeverityCounts(
  left: PrototypeDefectDojoSeverityCounts | null,
  right: PrototypeDefectDojoSeverityCounts | null
): number {
  if (left === null || right === null) {
    return Number(left === null) - Number(right === null);
  }
  return right.critical - left.critical || right.high - left.high || right.total - left.total;
}

export interface FindingPlace {
  level: PrototypeDefectDojoLevel | null;
  /** Runtime: cluster and namespace. Code and Image: the codebase. */
  primary: string;
  /** Runtime: workload and container. Code and Image: scan type, branch and image. */
  secondary: string;
  /** Codebase of the row, when a join names one. */
  codebaseName: string | null;
  /** Stage of a Runtime row whose namespace is an Environment. */
  stage: PlatformStage | null;
}

/** Where a finding was found, from the tags of its test. */
export function describeFindingPlace(scope: PlatformScope, test: PrototypeDefectDojoTest): FindingPlace {
  if (test.level === "runtime") {
    const cluster = getTagValue(test.tags, PROTOTYPE_DEFECTDOJO_TAG_KEY.cluster);
    const namespace = getTagValue(test.tags, PROTOTYPE_DEFECTDOJO_TAG_KEY.namespace);
    const workload = getTagValue(test.tags, PROTOTYPE_DEFECTDOJO_TAG_KEY.workload);
    const container = getTagValue(test.tags, PROTOTYPE_DEFECTDOJO_TAG_KEY.container);
    const appTag = getTagValue(test.tags, PROTOTYPE_DEFECTDOJO_TAG_KEY.app);
    const stage = cluster !== null && namespace !== null ? findStage(scope, cluster, namespace) : null;
    // The codebase of a workload: the Application of the Stage whose name equals the `app` tag.
    const application =
      stage === null || appTag === null
        ? undefined
        : scope.applications.find(
            (candidate) =>
              candidate.applicationName.toLowerCase() === appTag &&
              candidate.cdPipeline === stage.cdPipeline &&
              candidate.stage === stage.stage
          );

    return {
      level: "runtime",
      primary: `${cluster ?? "?"} / ${namespace ?? "?"}`,
      secondary: `${workload ?? "?"} / ${container ?? "?"}${test.version ? ` : ${test.version}` : ""}`,
      codebaseName: application?.codebaseName ?? null,
      stage,
    };
  }

  const codebaseName = getTagValue(test.tags, PROTOTYPE_DEFECTDOJO_TAG_KEY.codebase);
  const image = getTagValue(test.tags, PROTOTYPE_DEFECTDOJO_TAG_KEY.ociImage);
  const details = [test.scanType, test.branchTag && `branch ${test.branchTag}`, image && `image ${image}`];

  return {
    level: test.level,
    primary: codebaseName ?? test.product.name,
    secondary: details.filter(Boolean).join(", "),
    codebaseName,
    stage: null,
  };
}
