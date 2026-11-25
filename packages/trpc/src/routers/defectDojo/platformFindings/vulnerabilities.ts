import {
  DEFECTDOJO_MAX_PAGE_SIZE,
  TRIAGED_RUNTIME_SCAN_LIMIT,
  hasVulnerabilityFilter,
  type CodebaseScanLevel,
  type FindingPlace,
  type RuntimeReportKind,
  type Vulnerabilities,
  type VulnerabilitiesRequest,
} from "@my-project/shared";
import {
  DEFECTDOJO_LEVEL_SCAN_TYPES,
  type DefectDojoFinding,
  type DefectDojoFindingTest,
  type DefectDojoFindingsPage,
  type DefectDojoFindingsQuery,
  type DefectDojoResult,
  type DefectDojoScanType,
  type DefectDojoTestTags,
} from "../../../clients/defectDojo/index.js";
import { toScanFinding } from "../codebaseFindings/compose.js";
import { ciTestTags } from "../codebaseFindings/scans.js";
import { TAG_KEY, formatTag, tagValue } from "../codebaseFindings/tags.js";
import { clustersOfStages, sortedUnique, type PlatformFacts, type PlatformStage } from "./facts.js";
import type { PlatformFindingsSource } from "./source.js";

const SECRET_SCAN_TYPES: readonly DefectDojoScanType[] = ["Gitleaks Scan"];

const VULNERABILITY_SCAN_TYPES = {
  code: DEFECTDOJO_LEVEL_SCAN_TYPES.code.filter((scanType) => !SECRET_SCAN_TYPES.includes(scanType)),
  image: [...DEFECTDOJO_LEVEL_SCAN_TYPES.image],
} satisfies Record<CodebaseScanLevel, DefectDojoScanType[]>;

const VULNERABILITY_REPORT: RuntimeReportKind = "vulnerabilityreport";

type RuntimeRequest = Extract<VulnerabilitiesRequest, { level: "runtime" }>;

interface ListScope {
  testTags: DefectDojoTestTags;
  scanTypes: readonly DefectDojoScanType[];
  /** The clusters of a Runtime list; `null`: every cluster, or a Code or Image list. */
  clusters: string[] | null;
}

interface Row {
  finding: DefectDojoFinding;
  test: DefectDojoFindingTest | undefined;
}

interface Rows {
  total: number;
  rows: Row[];
  truncated: boolean;
}

function runtimeClusters(request: RuntimeRequest, facts: PlatformFacts): string[] | null {
  const clusters = request.clusters ? sortedUnique(request.clusters) : clustersOfStages(facts);
  return clusters.length > 0 ? clusters : null;
}

function scopeOf(request: VulnerabilitiesRequest, facts: PlatformFacts): ListScope {
  if (request.level === "runtime") {
    const clusters = runtimeClusters(request, facts);
    return {
      testTags: {
        all: [
          formatTag(TAG_KEY.reportKind, VULNERABILITY_REPORT),
          ...(request.workloadNamespace ? [formatTag(TAG_KEY.namespace, request.workloadNamespace)] : []),
        ],
        any: clusters?.map((cluster) => formatTag(TAG_KEY.cluster, cluster)),
      },
      scanTypes: [],
      clusters,
    };
  }

  return {
    testTags: {
      all: request.codebase
        ? ciTestTags({ name: request.codebase, namespace: request.namespace })
        : [formatTag(TAG_KEY.tenant, request.namespace)],
    },
    scanTypes: VULNERABILITY_SCAN_TYPES[request.level],
    clusters: null,
  };
}

function openRows(page: DefectDojoFindingsPage): Row[] {
  const tests = new Map(page.tests.map((test) => [test.id, test]));
  return page.findings.flatMap((finding) => {
    const test = tests.get(finding.test.id);
    return test?.closed ? [] : [{ finding, test }];
  });
}

/** The total is DefectDojo's count: an active row of a closed test counts but is not listed. */
async function readPage(
  source: PlatformFindingsSource,
  query: DefectDojoFindingsQuery,
  { page, pageSize }: VulnerabilitiesRequest
): Promise<DefectDojoResult<Rows>> {
  const result = await source.listFindings({ ...query, limit: pageSize, offset: page * pageSize });
  return result.state === "data"
    ? { state: "data", data: { total: result.data.total, rows: openRows(result.data), truncated: false } }
    : result;
}

/**
 * Reads the most severe findings of the filter, at most `TRIAGED_RUNTIME_SCAN_LIMIT`, drops the rows of closed tests
 * and pages the rest, so that the total and the pages hold open tests only.
 */
async function readScanned(
  source: PlatformFindingsSource,
  query: DefectDojoFindingsQuery,
  { page, pageSize }: VulnerabilitiesRequest
): Promise<DefectDojoResult<Rows>> {
  const first = await source.listFindings({ ...query, limit: DEFECTDOJO_MAX_PAGE_SIZE, offset: 0 });
  if (first.state !== "data") {
    return first;
  }

  const readable = Math.min(first.data.total, TRIAGED_RUNTIME_SCAN_LIMIT);
  const offsets: number[] = [];
  for (let offset = DEFECTDOJO_MAX_PAGE_SIZE; offset < readable; offset += DEFECTDOJO_MAX_PAGE_SIZE) {
    offsets.push(offset);
  }
  const rest = await Promise.all(
    offsets.map((offset) =>
      source.listFindings({ ...query, limit: Math.min(DEFECTDOJO_MAX_PAGE_SIZE, readable - offset), offset })
    )
  );

  const rows = openRows(first.data);
  for (const result of rest) {
    if (result.state !== "data") {
      return result;
    }
    rows.push(...openRows(result.data));
  }

  return {
    state: "data",
    data: {
      total: rows.length,
      rows: rows.slice(page * pageSize, (page + 1) * pageSize),
      truncated: first.data.total > TRIAGED_RUNTIME_SCAN_LIMIT,
    },
  };
}

/** Whether a test is in the scope, for each scan type of a Code or Image list. */
async function hasScopeTests(source: PlatformFindingsSource, scope: ListScope): Promise<DefectDojoResult<boolean>> {
  const filters = scope.scanTypes.length > 0 ? scope.scanTypes.map((scanType) => ({ scanType })) : [{}];
  const results = await Promise.all(
    filters.map((filter) => source.hasTests({ tags: scope.testTags.all, anyTags: scope.testTags.any, ...filter }))
  );

  return (
    results.find((result) => result.state !== "data") ?? {
      state: "data",
      data: results.some((result) => result.state === "data" && result.data),
    }
  );
}

/**
 * Where a runtime test runs. The Application named by the `app` tag gives the Environment and the codebase when its
 * Stage deploys to this cluster and namespace; otherwise the first Stage that deploys there gives the Environment.
 */
function runtimePlace(test: DefectDojoFindingTest, facts: PlatformFacts): FindingPlace | null {
  const cluster = tagValue(test.tags, TAG_KEY.cluster);
  const namespace = tagValue(test.tags, TAG_KEY.namespace);
  if (cluster === null || namespace === null) {
    return null;
  }

  const deploysHere = (stage: PlatformStage) => stage.clusterName === cluster && stage.namespace === namespace;
  const app = tagValue(test.tags, TAG_KEY.app);
  const application = facts.applications.find((candidate) => candidate.name === app);
  const applicationStage =
    application &&
    facts.stages.find(
      (stage) => stage.cdPipeline === application.cdPipeline && stage.stage === application.stage && deploysHere(stage)
    );
  const stage = applicationStage ?? facts.stages.find(deploysHere);

  return {
    level: "runtime",
    cluster,
    namespace,
    workload: tagValue(test.tags, TAG_KEY.workload),
    container: tagValue(test.tags, TAG_KEY.container),
    image: tagValue(test.tags, TAG_KEY.ociImage),
    version: test.version,
    environment: stage ? { cdPipeline: stage.cdPipeline, stage: stage.stage } : null,
    codebase: applicationStage ? application.codebase : null,
  };
}

function ciPlace(test: DefectDojoFindingTest): FindingPlace | null {
  const codebase = tagValue(test.tags, TAG_KEY.codebase);
  if (codebase === null || (test.level !== "code" && test.level !== "image")) {
    return null;
  }
  return {
    level: test.level,
    codebase,
    branch: test.branchTag,
    image: test.level === "image" ? tagValue(test.tags, TAG_KEY.ociImage) : null,
    version: test.version,
  };
}

/**
 * One page of the vulnerability findings of a level, most severe first, each with where it was found. Rows of closed
 * runtime tests are never listed. `noScanData`: an empty page with no filter but the scope, and no test in the scope.
 */
export async function readVulnerabilities(
  source: PlatformFindingsSource,
  facts: PlatformFacts,
  request: VulnerabilitiesRequest
): Promise<Vulnerabilities> {
  const scope = scopeOf(request, facts);
  const query: DefectDojoFindingsQuery = {
    scope: { testTags: scope.testTags },
    scanTypes: scope.scanTypes,
    withTests: true,
    state: request.state,
    severities: request.severity ? [request.severity] : [],
    vulnerabilityId: request.vulnerabilityId,
    component: request.component,
  };

  const read =
    request.level === "runtime" && request.state !== "active"
      ? await readScanned(source, query, request)
      : await readPage(source, query, request);
  if (read.state !== "data") {
    return read;
  }

  if (read.data.total === 0 && !hasVulnerabilityFilter(request)) {
    const tests = await hasScopeTests(source, scope);
    if (tests.state !== "data") {
      return tests;
    }
    if (!tests.data) {
      return { state: "noScanData" };
    }
  }

  const placeOf = request.level === "runtime" ? (test: DefectDojoFindingTest) => runtimePlace(test, facts) : ciPlace;
  return {
    state: "data",
    total: read.data.total,
    findings: read.data.rows.map(({ finding, test }) => ({
      ...toScanFinding(finding),
      place: test === undefined ? null : placeOf(test),
    })),
    clusters: scope.clusters,
    truncated: read.data.truncated,
  };
}
