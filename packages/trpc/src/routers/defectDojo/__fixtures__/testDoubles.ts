import {
  K8sApiError,
  DEFECTDOJO_SEVERITIES,
  applicationLabels,
  getStageResourceName,
  k8sApplicationConfig,
  k8sStageConfig,
  type DefectDojoSeverity,
} from "@my-project/shared";
import type { Mock } from "vitest";
import { K8sClient } from "../../../clients/k8s/index.js";
import {
  FINDINGS_MAX_PAGE_SIZE,
  FINDING_STATE_PARAMS,
  levelOfScanType,
  type DefectDojoFinding,
  type DefectDojoFindingStateFilter,
  type DefectDojoOutage,
  type DefectDojoFindingsPage,
  type DefectDojoFindingsQuery,
  type DefectDojoScope,
  type DefectDojoProduct,
  type DefectDojoResult,
  type DefectDojoSeverityCounts,
  type DefectDojoTest,
  type DefectDojoTestsFilter,
} from "../../../clients/defectDojo/index.js";
import type { CodebaseFindingsSource } from "../codebaseFindings/source.js";
import type { PlatformFindingsSource } from "../platformFindings/source.js";
import type { SecurityOverviewSource } from "../securityOverview/source.js";
import { createKubeReader, type KubeObject, type KubeReaderOptions } from "./kubeReader.js";

const WEB_URL = "https://defectdojo.example.test";

export const DEMO_NAMESPACE = "krci";

export const DEMO_CODEBASE = "demo-app";

export const DEMO_IMAGE = "registry.example.test/krci/demo-app";

export const SEMGREP = "Semgrep JSON Report";
export const GITLEAKS = "Gitleaks Scan";
export const TRIVY = "Trivy Scan";
export const GRYPE = "Anchore Grype";

/** The tags the CI security scan writes on the tests of a codebase. */
export function codebaseTags(codebase = DEMO_CODEBASE, namespace = DEMO_NAMESPACE): string[] {
  return [`app.edp.epam.com/codebase:${codebase}`, `app.edp.epam.com/tenant:${namespace}`];
}

/** A CI test of the demo codebase on `main`. */
export function makeTest(overrides: Partial<DefectDojoTest> & Pick<DefectDojoTest, "id" | "scanType">): DefectDojoTest {
  return {
    title: overrides.scanType,
    level: levelOfScanType(overrides.scanType),
    branchTag: "main",
    commitHash: "",
    version: "",
    buildId: "",
    closed: false,
    tags: codebaseTags(),
    created: "2026-11-20T10:00:00Z",
    updated: "2026-11-23T10:00:00Z",
    url: `${WEB_URL}/test/${overrides.id}`,
    engagement: {
      id: 100 + overrides.id,
      name: `engagement-${overrides.id}`,
      url: `${WEB_URL}/engagement/${overrides.id}`,
    },
    product: { id: 7, name: DEMO_CODEBASE, url: `${WEB_URL}/asset/7` },
    ...overrides,
  };
}

/** A CI test of an image scan, tagged with the scanned image. */
export function makeImageTest(
  overrides: Partial<DefectDojoTest> & Pick<DefectDojoTest, "id" | "scanType"> & { image: string }
): DefectDojoTest {
  const { image, ...test } = overrides;
  return makeTest({ version: "main-20261123", tags: [...codebaseTags(), `oci-image:${image}`], ...test });
}

/** The Environment of the demo codebase that `makeApplication` and `makeStage` describe by default. */
export const DEMO_PIPELINE = "demo";
export const DEMO_STAGE = "dev";
export const DEMO_STAGE_NAMESPACE = "demo-dev";
export const DEMO_APPLICATION = "demo-dev-demo-app";
export const DEMO_WORKLOAD = "deployment.demo-app";
export const DEMO_CONTAINER = "demo-app";

const RUNTIME_SCAN_TYPE = "Trivy Operator Scan";

export type RuntimeTestOverrides = Partial<Omit<DefectDojoTest, "tags" | "level" | "scanType" | "closed">> &
  Pick<DefectDojoTest, "id"> & {
    cluster?: string;
    namespace?: string;
    /** A tag value; `null`: the test carries no tag of that key. */
    application?: string | null;
    workload?: string | null;
    container?: string | null;
    image?: string | null;
    reportKind?: string | null;
  };

/**
 * A test of the security operator for one report of a container of the demo Environment: open (it has a build id)
 * and a VulnerabilityReport by default. An empty `buildId` closes it, as the client reads it.
 */
export function makeRuntimeTest({
  cluster = "in-cluster",
  namespace = DEMO_STAGE_NAMESPACE,
  application = DEMO_APPLICATION,
  workload = DEMO_WORKLOAD,
  container = DEMO_CONTAINER,
  image = DEMO_IMAGE,
  reportKind = "vulnerabilityreport",
  buildId = "build-1",
  ...test
}: RuntimeTestOverrides): DefectDojoTest {
  const tag = (key: string, value: string | null) => (value === null ? [] : [`${key}:${value}`]);

  return makeTest({
    scanType: RUNTIME_SCAN_TYPE,
    branchTag: "",
    version: "main",
    buildId,
    closed: buildId === "",
    tags: [
      ...tag("k8s-cluster", cluster),
      ...tag("k8s-namespace", namespace),
      ...tag("app", application),
      ...tag("k8s-workload", workload),
      ...tag("k8s-container", container),
      ...tag("oci-image", image),
      ...tag("report-kind", reportKind),
    ],
    ...test,
  });
}

/** An active finding. */
export function makeFinding(
  overrides: Partial<DefectDojoFinding> & Pick<DefectDojoFinding, "id"> & { testId?: number }
): DefectDojoFinding {
  const { testId = 1, ...finding } = overrides;
  return {
    title: `Finding ${overrides.id}`,
    severity: "High",
    active: true,
    verified: false,
    duplicate: false,
    falsePositive: false,
    outOfScope: false,
    riskAccepted: false,
    mitigated: false,
    underReview: false,
    date: "2026-11-23",
    created: null,
    updated: null,
    mitigatedAt: null,
    componentName: null,
    componentVersion: null,
    vulnerabilityIds: [],
    filePath: null,
    line: null,
    service: null,
    fixAvailable: null,
    fixVersion: null,
    url: `${WEB_URL}/finding/${overrides.id}`,
    test: { id: testId, url: `${WEB_URL}/test/${testId}` },
    engagement: { id: 100 + testId, url: `${WEB_URL}/engagement/${100 + testId}` },
    product: { id: 7, url: `${WEB_URL}/asset/7` },
    ...finding,
  };
}

export function activeFindings(testId: number, severity: DefectDojoSeverity, count: number, firstId = 1) {
  return Array.from({ length: count }, (_, index) =>
    makeFinding({ id: testId * 1000 + firstId + index, testId, severity })
  );
}

/** A finding that was triaged: it is no longer active. */
export function makeTriagedFinding(
  overrides: Partial<DefectDojoFinding> & Pick<DefectDojoFinding, "id"> & { testId?: number }
): DefectDojoFinding {
  return makeFinding({ active: false, mitigated: true, ...overrides });
}

export type FakeDefectDojo = CodebaseFindingsSource & PlatformFindingsSource & SecurityOverviewSource;

type SourceCall = keyof FakeDefectDojo;

export interface FakeDefectDojoOptions {
  tests?: readonly DefectDojoTest[];
  /** Findings by id of their test, in every state. */
  findings?: Record<number, readonly DefectDojoFinding[]>;
  /** Products of the Product Type, with their tags. */
  products?: readonly DefectDojoProduct[];
  /** The calls of `outageOn` answer with this state. */
  outage?: DefectDojoOutage["state"];
  /** Default: every call. */
  outageOn?: readonly SourceCall[];
}

function severityRank(severity: DefectDojoSeverity): number {
  return DEFECTDOJO_SEVERITIES.indexOf(severity);
}

function carriesTags(test: DefectDojoTest, all: readonly string[], any: readonly string[] = []): boolean {
  const stored = test.tags.map((tag) => tag.toLowerCase());
  const has = (tag: string) => stored.includes(tag.toLowerCase());
  return all.every(has) && (any.length === 0 || any.some(has));
}

/**
 * A DefectDojo of one Product Type that answers like the client does: tests and products by tags, counts of one
 * test or of a set of products (the products of the findings), findings of one test or of the tests that carry tags,
 * duplicates never counted or listed. Findings of a product set are not modelled.
 */
export function createFakeDefectDojo({
  tests = [],
  findings = {},
  products = [],
  outage,
  outageOn,
}: FakeDefectDojoOptions = {}): FakeDefectDojo {
  const outageResult = <T>(call: SourceCall): DefectDojoResult<T> | undefined =>
    outage && (outageOn === undefined || outageOn.includes(call)) ? { state: outage } : undefined;

  const findingsOf = (testId: number) => (findings[testId] ?? []).filter((finding) => !finding.duplicate);

  /** The findings a counts scope reads, or `null` for no scan data: an empty set of products, an unknown test. */
  const countedFindings = (scope: DefectDojoScope): DefectDojoFinding[] | null => {
    if ("productIds" in scope) {
      return scope.productIds.length === 0
        ? null
        : Object.values(findings)
            .flat()
            .filter((finding) => !finding.duplicate && scope.productIds.includes(finding.product.id));
    }
    return tests.some((test) => test.id === scope.testId) ? findingsOf(scope.testId) : null;
  };

  const testsOf = (filter: DefectDojoTestsFilter) =>
    tests.filter(
      (test) =>
        carriesTags(test, filter.tags, filter.anyTags) &&
        (filter.branchTag === undefined || test.branchTag === filter.branchTag) &&
        (filter.scanType === undefined || test.scanType === filter.scanType)
    );

  /** The tests a findings scope reads, or `null` for a test that does not exist. */
  const scopeTests = (query: DefectDojoFindingsQuery): DefectDojoTest[] | null => {
    if ("productIds" in query.scope) {
      throw new Error("The fake DefectDojo models no findings of a product set");
    }
    if ("testId" in query.scope) {
      const { testId } = query.scope;
      const test = tests.find((candidate) => candidate.id === testId);
      return test ? [test] : null;
    }
    const { all, any } = query.scope.testTags;
    const scanTypes: readonly string[] = query.scanTypes ?? [];
    return tests.filter(
      (test) => carriesTags(test, all, any) && (scanTypes.length === 0 || scanTypes.includes(test.scanType))
    );
  };

  return {
    cacheScope: WEB_URL,

    async listTests(filter: DefectDojoTestsFilter): Promise<DefectDojoResult<DefectDojoTest[]>> {
      const matching = testsOf(filter);
      return (
        outageResult("listTests") ?? (matching.length > 0 ? { state: "data", data: matching } : { state: "noScanData" })
      );
    },

    async hasTests(filter: DefectDojoTestsFilter): Promise<DefectDojoResult<boolean>> {
      return outageResult("hasTests") ?? { state: "data", data: testsOf(filter).length > 0 };
    },

    async listProductsWithTagText(text: string): Promise<DefectDojoResult<DefectDojoProduct[]>> {
      const matching = products.filter((product) =>
        product.tags.some((tag) => tag.toLowerCase().includes(text.toLowerCase()))
      );
      return (
        outageResult("listProductsWithTagText") ??
        (matching.length > 0 ? { state: "data", data: matching } : { state: "noScanData" })
      );
    },

    async getSeverityCounts(scope, options = {}): Promise<DefectDojoResult<DefectDojoSeverityCounts>> {
      const all = countedFindings(scope);
      if (all === null) {
        return outageResult("getSeverityCounts") ?? { state: "noScanData" };
      }

      const state = options.state ?? "active";
      const counted = state === "any" ? all : all.filter((finding) => stateFlag(finding, state));
      const countOf = (severity: DefectDojoSeverity) =>
        counted.filter((finding) => finding.severity === severity).length;

      return (
        outageResult("getSeverityCounts") ?? {
          state: "data",
          data: {
            total: counted.length,
            active: all.filter((finding) => finding.active).length,
            severity: {
              Critical: countOf("Critical"),
              High: countOf("High"),
              Medium: countOf("Medium"),
              Low: countOf("Low"),
              Info: countOf("Info"),
            },
          },
        }
      );
    },

    async listFindings(query): Promise<DefectDojoResult<DefectDojoFindingsPage>> {
      const read = scopeTests(query);
      if (read === null) {
        return outageResult("listFindings") ?? { state: "noScanData" };
      }

      const state: DefectDojoFindingStateFilter = query.state ?? "active";
      const severities = query.severities ?? [];
      const component = query.component?.toLowerCase();
      const matching = read
        .flatMap((test) => findingsOf(test.id))
        .filter((finding) => state === "any" || stateFlag(finding, state))
        .filter((finding) => severities.length === 0 || severities.includes(finding.severity))
        .filter((finding) => !query.vulnerabilityId || finding.vulnerabilityIds.includes(query.vulnerabilityId))
        .filter((finding) => !component || (finding.componentName ?? "").toLowerCase().includes(component))
        .sort((a, b) => severityRank(a.severity) - severityRank(b.severity) || a.id - b.id);

      const offset = query.offset ?? 0;
      const limit = Math.min(query.limit ?? FINDINGS_MAX_PAGE_SIZE, FINDINGS_MAX_PAGE_SIZE);
      const page = matching.slice(offset, offset + limit);
      const pageTests = query.withTests
        ? read.filter((test) => page.some((finding) => finding.test.id === test.id))
        : [];

      return (
        outageResult("listFindings") ?? {
          state: "data",
          data: {
            total: matching.length,
            findings: page,
            tests: pageTests.map(({ engagement: _engagement, product: _product, ...test }) => test),
          },
        }
      );
    },
  };
}

/** The finding fields that the query parameters of `FINDING_STATE_PARAMS` select on. */
type FindingStateParam = {
  [State in keyof typeof FINDING_STATE_PARAMS]: keyof (typeof FINDING_STATE_PARAMS)[State];
}[keyof typeof FINDING_STATE_PARAMS];

const FINDING_FLAGS = {
  active: "active",
  is_mitigated: "mitigated",
  false_p: "falsePositive",
  out_of_scope: "outOfScope",
  risk_accepted: "riskAccepted",
} as const satisfies Record<FindingStateParam, keyof DefectDojoFinding>;

function stateFlag(finding: DefectDojoFinding, state: Exclude<DefectDojoFindingStateFilter, "any">): boolean {
  return Object.entries(FINDING_STATE_PARAMS[state]).every(
    ([param, wanted]) => finding[FINDING_FLAGS[param as FindingStateParam]] === wanted
  );
}

export function makeCodebase(name = DEMO_CODEBASE, defaultBranch = "main", namespace = DEMO_NAMESPACE): KubeObject {
  return { kind: "Codebase", metadata: { name, namespace }, spec: { defaultBranch } };
}

export function makeBranch(branchName: string, codebase = DEMO_CODEBASE, namespace = DEMO_NAMESPACE): KubeObject {
  return {
    kind: "CodebaseBranch",
    metadata: {
      name: `${codebase}-${branchName.replaceAll("/", "-")}`,
      namespace,
      labels: { "app.edp.epam.com/codebaseName": codebase },
    },
    spec: { branchName, codebaseName: codebase },
  };
}

export function makeImageStream(
  imageName: string,
  codebase = DEMO_CODEBASE,
  name = `${codebase}-main`,
  namespace = DEMO_NAMESPACE
): KubeObject {
  return { kind: "CodebaseImageStream", metadata: { name, namespace }, spec: { codebase, imageName } };
}

export interface ApplicationOptions {
  name?: string;
  /** Value of the label `app-name`: the codebase the Application deploys. `null`: the Application has no such label. */
  codebase?: string | null;
  /** `null`: the Application has no such label. */
  pipeline?: string | null;
  stage?: string | null;
  namespace?: string;
}

export function makeApplication({
  name = DEMO_APPLICATION,
  codebase = DEMO_CODEBASE,
  pipeline = DEMO_PIPELINE,
  stage = DEMO_STAGE,
  namespace = DEMO_NAMESPACE,
}: ApplicationOptions = {}): KubeObject {
  return {
    kind: k8sApplicationConfig.kind,
    metadata: {
      name,
      namespace,
      labels: {
        ...(codebase === null ? {} : { [applicationLabels.appName]: codebase }),
        ...(pipeline === null ? {} : { [applicationLabels.pipeline]: pipeline }),
        ...(stage === null ? {} : { [applicationLabels.stage]: stage }),
      },
    },
    spec: {},
  };
}

export interface StageOptions {
  cdPipeline?: string;
  /** `spec.name`. */
  name?: string;
  /** `spec.clusterName`. Left out: the default of the CRD, `in-cluster`. */
  clusterName?: string;
  /** `spec.namespace`: where the Stage deploys. */
  namespace?: string;
  order?: number;
  /** Namespace of the Stage object. */
  platformNamespace?: string;
}

export function makeStage({
  cdPipeline = DEMO_PIPELINE,
  name = DEMO_STAGE,
  clusterName,
  namespace = DEMO_STAGE_NAMESPACE,
  order = 0,
  platformNamespace = DEMO_NAMESPACE,
}: StageOptions = {}): KubeObject {
  return {
    kind: k8sStageConfig.kind,
    metadata: { name: getStageResourceName(cdPipeline, name), namespace: platformNamespace },
    spec: { cdPipeline, name, namespace, order, ...(clusterName === undefined ? {} : { clusterName }) },
  };
}

/** The codebase as the platform holds it: one branch and the image stream of its own image. It runs nowhere. */
export const DEMO_CLUSTER: KubeObject[] = [makeCodebase(), makeBranch("main"), makeImageStream(DEMO_IMAGE)];

/** `DEMO_CLUSTER`, deployed by one Application to the Stage `demo` / `dev`. */
export const DEPLOYED_CLUSTER: KubeObject[] = [...DEMO_CLUSTER, makeApplication(), makeStage()];

/** The signed-in user may not read the Codebase: its get answers 403, a list answers nothing. */
export function givenCodebaseForbidden() {
  (K8sClient as unknown as Mock).mockImplementation(function () {
    return {
      KubeConfig: {},
      async getResource() {
        throw new K8sApiError(403, "Forbidden", "codebases is forbidden");
      },
      async listResource() {
        return { items: [] };
      },
    };
  });
}

/** The cluster the mocked `K8sClient` of the test file reads. */
export function givenCluster(objects: KubeObject[] = DEMO_CLUSTER, options: KubeReaderOptions = {}) {
  (K8sClient as unknown as Mock).mockImplementation(function () {
    return { KubeConfig: {}, ...createKubeReader(objects, options) };
  });
}

/** A namespace product of the security operator, tagged with its cluster and namespace. */
export function makeNamespaceProduct(
  id: number,
  cluster: string,
  namespace: string,
  tags: readonly string[] = [`k8s-cluster:${cluster}`, `k8s-namespace:${namespace}`]
): DefectDojoProduct {
  return { id, name: `${cluster}/${namespace}`, tags: [...tags], url: `${WEB_URL}/asset/${id}` };
}

/** The installation: two Stages of one CDPipeline, one on a remote cluster, each with an Application of demo-app. */
export const DEMO_PLATFORM: KubeObject[] = [
  makeStage({ name: "dev", namespace: "demo-dev" }),
  makeStage({ name: "prod", clusterName: "remote-cluster", namespace: "demo-prod", order: 1 }),
  makeApplication({ name: "demo-dev-demo-app", stage: "dev" }),
  makeApplication({ name: "demo-prod-demo-app", stage: "prod" }),
];

export function findingOf(
  id: number,
  testId: number,
  severity: DefectDojoSeverity,
  extra: Partial<DefectDojoFinding> = {}
): DefectDojoFinding {
  return makeFinding({ id, testId, severity, ...extra });
}

/** A finding of each severity of `severities` in `test`, of the product of the test. */
export function makeFindingsOf(
  test: DefectDojoTest,
  severities: readonly DefectDojoSeverity[],
  firstId = test.id * 100
): DefectDojoFinding[] {
  return severities.map((severity, index) =>
    findingOf(firstId + index, test.id, severity, { product: { id: test.product.id, url: test.product.url } })
  );
}

export const idOfFindingUrl = (url: string) => Number(url.split("/").pop());
