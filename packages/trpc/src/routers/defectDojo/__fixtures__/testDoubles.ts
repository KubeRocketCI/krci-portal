import {
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
  levelOfScanType,
  type DefectDojoFinding,
  type DefectDojoFindingStateFilter,
  type DefectDojoFindingsPage,
  type DefectDojoResult,
  type DefectDojoScope,
  type DefectDojoSeverityCounts,
  type DefectDojoTest,
  type DefectDojoTestsFilter,
} from "../../../clients/defectDojo/index.js";
import type { CodebaseFindingsSource } from "../codebaseFindings/source.js";
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
    application?: string;
    /** A tag value; `null`: the test carries no tag of that key. */
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

/** A finding that was triaged: it is no longer active. */
export function makeTriagedFinding(
  overrides: Partial<DefectDojoFinding> & Pick<DefectDojoFinding, "id"> & { testId?: number }
): DefectDojoFinding {
  return makeFinding({ active: false, mitigated: true, ...overrides });
}

export type DefectDojoOutage = "notConfigured" | "unreachable";

type SourceCall = keyof CodebaseFindingsSource;

export interface FakeDefectDojoOptions {
  tests?: readonly DefectDojoTest[];
  /** Findings by id of their test, in every state. */
  findings?: Record<number, readonly DefectDojoFinding[]>;
  /** The calls of `outageOn` answer with this state. */
  outage?: DefectDojoOutage;
  /** Default: every call. */
  outageOn?: readonly SourceCall[];
}

function severityRank(severity: DefectDojoSeverity): number {
  return DEFECTDOJO_SEVERITIES.indexOf(severity);
}

/**
 * A DefectDojo that answers like the client does: tests by tags, counts and findings of one test, duplicates
 * never counted or listed. Findings of a product set are not modelled.
 */
export function createFakeDefectDojo({
  tests = [],
  findings = {},
  outage,
  outageOn = ["listTests", "getSeverityCounts", "listFindings"],
}: FakeDefectDojoOptions = {}): CodebaseFindingsSource {
  const outageResult = <T>(call: SourceCall): DefectDojoResult<T> | undefined =>
    outage && outageOn.includes(call) ? { state: outage } : undefined;

  const findingsOf = (testId: number) => (findings[testId] ?? []).filter((finding) => !finding.duplicate);

  const testIdOf = (scope: DefectDojoScope): number => {
    if (!("testId" in scope)) {
      throw new Error("The fake DefectDojo models the findings of a test only");
    }
    return scope.testId;
  };

  return {
    async listTests(filter: DefectDojoTestsFilter): Promise<DefectDojoResult<DefectDojoTest[]>> {
      const wanted = filter.tags.map((tag) => tag.toLowerCase());
      const matching = tests.filter(
        (test) =>
          wanted.every((tag) => test.tags.map((stored) => stored.toLowerCase()).includes(tag)) &&
          (filter.branchTag === undefined || test.branchTag === filter.branchTag) &&
          (filter.scanType === undefined || test.scanType === filter.scanType)
      );
      return (
        outageResult("listTests") ?? (matching.length > 0 ? { state: "data", data: matching } : { state: "noScanData" })
      );
    },

    async getSeverityCounts(scope, options = {}): Promise<DefectDojoResult<DefectDojoSeverityCounts>> {
      const testId = testIdOf(scope);
      if (!tests.some((test) => test.id === testId)) {
        return outageResult("getSeverityCounts") ?? { state: "noScanData" };
      }

      const all = findingsOf(testId);
      const counted = options.activeOnly === false ? all : all.filter((finding) => finding.active);
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
      const testId = testIdOf(query.scope);
      if (!tests.some((test) => test.id === testId)) {
        return outageResult("listFindings") ?? { state: "noScanData" };
      }

      const state: DefectDojoFindingStateFilter = query.state ?? "active";
      const severities = query.severities ?? [];
      const matching = findingsOf(testId)
        .filter((finding) => state === "any" || stateFlag(finding, state))
        .filter((finding) => severities.length === 0 || severities.includes(finding.severity))
        .sort((a, b) => severityRank(a.severity) - severityRank(b.severity) || a.id - b.id);

      const offset = query.offset ?? 0;
      const limit = query.limit ?? 100;
      return (
        outageResult("listFindings") ?? {
          state: "data",
          data: { total: matching.length, findings: matching.slice(offset, offset + limit) },
        }
      );
    },
  };
}

function stateFlag(finding: DefectDojoFinding, state: Exclude<DefectDojoFindingStateFilter, "any">): boolean {
  switch (state) {
    case "active":
      return finding.active;
    case "mitigated":
      return finding.mitigated;
    case "falsePositive":
      return finding.falsePositive;
    case "outOfScope":
      return finding.outOfScope;
    case "riskAccepted":
      return finding.riskAccepted;
  }
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
  /** Value of the label `app-name`: the codebase the Application deploys. */
  codebase?: string;
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
        [applicationLabels.appName]: codebase,
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

/** The cluster the mocked `K8sClient` of the test file reads. */
export function givenCluster(objects: KubeObject[] = DEMO_CLUSTER, options: KubeReaderOptions = {}) {
  (K8sClient as unknown as Mock).mockImplementation(function () {
    return { KubeConfig: {}, ...createKubeReader(objects, options) };
  });
}
