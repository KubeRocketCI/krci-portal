import {
  DEFECTDOJO_MAX_PAGE_SIZE,
  TRIAGED_RUNTIME_SCAN_LIMIT,
  VULNERABILITIES_DEFAULT_PAGE_SIZE,
  k8sApplicationConfig,
  type DefectDojoSeverity,
  type Vulnerabilities,
  type VulnerabilitiesInput,
} from "@my-project/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockedContext } from "../../../../__mocks__/context.js";
import { K8sClient } from "../../../../clients/k8s/index.js";
import type { DefectDojoFinding } from "../../../../clients/defectDojo/index.js";
import { createCaller } from "../../../index.js";
import {
  DEMO_IMAGE,
  DEMO_NAMESPACE,
  GITLEAKS,
  GRYPE,
  SEMGREP,
  TRIVY,
  codebaseTags,
  createFakeDefectDojo,
  givenCluster,
  makeApplication,
  makeFinding,
  makeImageTest,
  makeRuntimeTest,
  makeStage,
  makeTest,
  makeTriagedFinding,
  type FakeDefectDojo,
  type FakeDefectDojoOptions,
  type RuntimeTestOverrides,
} from "../../__fixtures__/testDoubles.js";
import type { KubeObject, KubeReaderOptions } from "../../__fixtures__/kubeReader.js";

const doubles = vi.hoisted(() => ({ defectDojo: null as FakeDefectDojo | null }));

vi.mock("../../../../clients/defectDojo/index.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../clients/defectDojo/index.js")>()),
  createDefectDojoClient: () => doubles.defectDojo,
}));

vi.mock("../../../../clients/k8s/index.js", () => ({ K8sClient: vi.fn() }));

const CVE = "CVE-2026-0001";

/** The installation: two Stages of one CDPipeline, one on a remote cluster, each with an Application of demo-app. */
const PLATFORM: KubeObject[] = [
  makeStage({ name: "dev", namespace: "demo-dev" }),
  makeStage({ name: "prod", clusterName: "remote-cluster", namespace: "demo-prod", order: 1 }),
  makeApplication({ name: "demo-dev-demo-app", stage: "dev" }),
  makeApplication({ name: "demo-prod-demo-app", stage: "prod" }),
];

const runtime = (id: number, overrides: Omit<RuntimeTestOverrides, "id">) => makeRuntimeTest({ id, ...overrides });

/**
 * Runtime tests: the demo Environments, an exposed secret report, a platform namespace without a Stage, a closed test
 * (empty build id), a cluster without a Stage, a workload of no Application.
 */
const RUNTIME_TESTS = [
  runtime(1, { namespace: "demo-dev", application: "demo-dev-demo-app" }),
  runtime(2, { namespace: "demo-dev", application: "demo-dev-demo-app", reportKind: "exposedsecretreport" }),
  runtime(3, {
    cluster: "remote-cluster",
    namespace: "demo-prod",
    application: "demo-prod-demo-app",
    version: "0.9.0",
  }),
  runtime(4, { namespace: "argocd", application: "argocd", workload: "deployment.argocd-server", container: "server" }),
  runtime(5, { namespace: "demo-dev", application: "demo-dev-demo-app", workload: "deployment.worker", buildId: "" }),
  runtime(6, { cluster: "edge", namespace: "ingress", application: "ingress", workload: "daemonset.proxy" }),
  runtime(7, { namespace: "demo-dev", application: "sidecar", workload: "deployment.sidecar", container: "sidecar" }),
];

/** CI tests of the tenant: two image scanners, Semgrep and Gitleaks of demo-app, Semgrep of two more codebases. */
const CI_TESTS = [
  makeImageTest({ id: 10, scanType: TRIVY, image: DEMO_IMAGE, version: "main-1" }),
  makeImageTest({ id: 11, scanType: GRYPE, image: DEMO_IMAGE, version: "main-1" }),
  makeTest({ id: 12, scanType: SEMGREP }),
  makeTest({ id: 13, scanType: GITLEAKS }),
  makeTest({ id: 14, scanType: SEMGREP, tags: codebaseTags("other-app") }),
  makeTest({ id: 15, scanType: SEMGREP, tags: codebaseTags("clean-app") }),
];

function finding(id: number, testId: number, severity: DefectDojoSeverity, extra: Partial<DefectDojoFinding> = {}) {
  return makeFinding({ id, testId, severity, ...extra });
}

const FINDINGS: Record<number, DefectDojoFinding[]> = {
  1: [
    finding(1101, 1, "Critical", { vulnerabilityIds: [CVE], componentName: "openssl" }),
    finding(1102, 1, "High"),
    finding(1103, 1, "Low"),
  ],
  2: [finding(1201, 2, "High", { title: "AWS access key" })],
  3: [finding(1301, 3, "High", { vulnerabilityIds: [CVE] }), finding(1302, 3, "Medium")],
  4: [finding(1401, 4, "Critical"), makeTriagedFinding({ id: 1402, testId: 4, severity: "High", falsePositive: true })],
  5: [finding(1501, 5, "High"), makeTriagedFinding({ id: 1502, testId: 5, severity: "Medium", falsePositive: true })],
  6: [finding(1601, 6, "Low")],
  7: [finding(1701, 7, "Info")],
  10: [
    finding(2001, 10, "Critical", { vulnerabilityIds: [CVE], componentName: "openssl" }),
    makeTriagedFinding({ id: 2002, testId: 10, severity: "High" }),
    makeTriagedFinding({ id: 2003, testId: 10, severity: "High", falsePositive: true }),
  ],
  11: [finding(2101, 11, "High")],
  12: [finding(2201, 12, "Medium", { filePath: "main.go", line: 12 })],
  13: [finding(2301, 13, "High", { title: "Generic API key" })],
  14: [finding(2401, 14, "Low")],
};

function givenDefectDojo(options: FakeDefectDojoOptions = {}): FakeDefectDojo {
  doubles.defectDojo = createFakeDefectDojo({ tests: [...RUNTIME_TESTS, ...CI_TESTS], findings: FINDINGS, ...options });
  return doubles.defectDojo;
}

function givenPlatform(objects: KubeObject[] = PLATFORM, options: KubeReaderOptions = {}) {
  givenCluster(objects, options);
}

const idOf = (url: string) => Number(url.split("/").pop());

describe("defectDojo.getVulnerabilities", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  async function getVulnerabilities(input: Partial<VulnerabilitiesInput> = {}): Promise<Vulnerabilities> {
    return createCaller(mockContext).defectDojo.getVulnerabilities({
      level: "runtime",
      namespace: DEMO_NAMESPACE,
      ...input,
    } as VulnerabilitiesInput);
  }

  async function getData(
    input: Partial<VulnerabilitiesInput> = {}
  ): Promise<Extract<Vulnerabilities, { state: "data" }>> {
    const result = await getVulnerabilities(input);
    if (result.state !== "data") {
      throw new Error(`Expected data, got ${result.state}`);
    }
    return result;
  }

  async function idsOf(input: Partial<VulnerabilitiesInput> = {}): Promise<number[]> {
    return (await getData(input)).findings.map((row) => idOf(row.url));
  }

  beforeEach(() => {
    mockContext = createMockedContext();
    vi.stubEnv("DEFECTDOJO_URL", "http://defectdojo.example.test");
    vi.stubEnv("DEFECTDOJO_TOKEN", "service-token");
    givenPlatform();
    givenDefectDojo();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    doubles.defectDojo = null;
  });

  describe("the Runtime list", () => {
    it("opens on the clusters of the installation's Stages, most severe first", async () => {
      const result = await getData();

      expect(result.findings.map((row) => idOf(row.url))).toEqual([1101, 1401, 1102, 1301, 1302, 1103, 1701]);
      expect(result.clusters).toEqual(["in-cluster", "remote-cluster"]);
    });

    it("lists every cluster when the installation has no Stage", async () => {
      givenPlatform([]);

      const result = await getData();

      expect(result.findings.map((row) => idOf(row.url))).toContain(1601);
      expect(result.clusters).toBeNull();
    });

    it("lists the clusters it is asked for", async () => {
      const result = await getData({ clusters: ["edge"] });

      expect(result.findings.map((row) => idOf(row.url))).toEqual([1601]);
      expect(result.clusters).toEqual(["edge"]);
    });

    it("lists one namespace of the clusters", async () => {
      expect(await idsOf({ workloadNamespace: "demo-prod" })).toEqual([1301, 1302]);
    });

    it("leaves the exposed secret reports out", async () => {
      expect(await idsOf({ severity: "High" })).toEqual([1102, 1301]);
    });

    it("leaves a closed test out: an active finding of a test without a build id is not listed", async () => {
      expect(await idsOf({ workloadNamespace: "demo-dev" })).not.toContain(1501);
    });

    it("leaves a closed test out of a triaged state, with an exact total", async () => {
      const result = await getData({ state: "falsePositive" });

      expect(result.findings.map((row) => idOf(row.url))).toEqual([1402]);
      expect(result.total).toBe(1);
      expect(result.truncated).toBe(false);
    });

    it.each([
      ["falsePositive", { falsePositive: true }],
      ["outOfScope", { outOfScope: true }],
      ["riskAccepted", { riskAccepted: true, mitigated: false }],
    ] as const)("lists the %s findings of the open tests only", async (state, flags) => {
      givenDefectDojo({
        findings: {
          4: [makeTriagedFinding({ id: 4001, testId: 4, ...flags })],
          5: [makeTriagedFinding({ id: 5001, testId: 5, ...flags })],
        },
      });

      const result = await getData({ state });

      expect(result.findings.map((row) => idOf(row.url))).toEqual([4001]);
      expect(result.total).toBe(1);
    });

    it("pages a triaged state on the server after the rows of closed tests are dropped", async () => {
      givenDefectDojo({
        findings: {
          4: Array.from({ length: 30 }, (_, index) =>
            makeTriagedFinding({ id: 4000 + index, testId: 4, falsePositive: true })
          ),
          5: Array.from({ length: 10 }, (_, index) =>
            makeTriagedFinding({ id: 5000 + index, testId: 5, falsePositive: true, severity: "Critical" })
          ),
        },
      });

      const result = await getData({ state: "falsePositive", page: 1, pageSize: 25 });

      expect(result.findings.map((row) => idOf(row.url))).toEqual([4025, 4026, 4027, 4028, 4029]);
      expect(result.total).toBe(30);
    });

    it(`reads at most ${TRIAGED_RUNTIME_SCAN_LIMIT} findings of a triaged state, the most severe, and says so`, async () => {
      givenDefectDojo({
        findings: {
          4: Array.from({ length: TRIAGED_RUNTIME_SCAN_LIMIT + 100 }, (_, index) =>
            makeTriagedFinding({ id: 10_000 + index, testId: 4, outOfScope: true })
          ),
        },
      });

      const result = await getData({ state: "outOfScope" });

      expect(result.truncated).toBe(true);
      expect(result.total).toBe(TRIAGED_RUNTIME_SCAN_LIMIT);
      expect(result.findings).toHaveLength(VULNERABILITIES_DEFAULT_PAGE_SIZE);
    });

    it("rejects the Mitigated state: every finding of a closed test is mitigated", async () => {
      await expect(getVulnerabilities({ state: "mitigated" } as Partial<VulnerabilitiesInput>)).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
    });
  });

  describe("the Image and Code lists", () => {
    it("list the image findings of the tenant's codebases from both image scanners", async () => {
      expect(await idsOf({ level: "image" })).toEqual([2001, 2101]);
    });

    it("list the code findings without the Gitleaks secrets", async () => {
      expect(await idsOf({ level: "code" })).toEqual([2201, 2401]);
    });

    it("list one codebase", async () => {
      expect(await idsOf({ level: "code", codebase: "demo-app" })).toEqual([2201]);
    });

    it("list the fixed findings as Mitigated, without the false positives DefectDojo marks mitigated as well", async () => {
      expect(await idsOf({ level: "image", state: "mitigated" })).toEqual([2002]);
    });

    it.each([
      ["active", 3001],
      ["mitigated", 3002],
      ["falsePositive", 3003],
      ["outOfScope", 3004],
      ["riskAccepted", 3005],
    ] as const)("list the %s findings", async (state, id) => {
      givenDefectDojo({
        findings: {
          10: [
            finding(3001, 10, "High"),
            makeTriagedFinding({ id: 3002, testId: 10 }),
            makeTriagedFinding({ id: 3003, testId: 10, falsePositive: true }),
            makeTriagedFinding({ id: 3004, testId: 10, outOfScope: true }),
            makeTriagedFinding({ id: 3005, testId: 10, riskAccepted: true, mitigated: false }),
          ],
        },
      });

      expect(await idsOf({ level: "image", state })).toEqual([id]);
    });

    it("have no clusters", async () => {
      expect((await getData({ level: "image" })).clusters).toBeNull();
    });
  });

  describe("the filters", () => {
    it("filter by severity", async () => {
      expect(await idsOf({ level: "image", severity: "Critical" })).toEqual([2001]);
    });

    it("filter by vulnerability id, exactly", async () => {
      expect(await idsOf({ vulnerabilityId: CVE })).toEqual([1101, 1301]);
      expect(await idsOf({ vulnerabilityId: CVE.toLowerCase() })).toEqual([]);
    });

    it("filter by a part of the component name, whatever its case", async () => {
      expect(await idsOf({ component: "OPENS" })).toEqual([1101]);
    });

    it("return the page asked for and the total DefectDojo counts, the active row of a closed test included", async () => {
      const result = await getData({ page: 1, pageSize: 2 });

      expect(result.findings.map((row) => idOf(row.url))).toEqual([1102, 1301]);
      expect(result.total).toBe(8);
    });

    it(`allow at most ${DEFECTDOJO_MAX_PAGE_SIZE} rows a page`, async () => {
      await expect(getVulnerabilities({ pageSize: DEFECTDOJO_MAX_PAGE_SIZE + 1 })).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
    });

    it("take no tag from the browser", async () => {
      await expect(
        getVulnerabilities({ tags: ["k8s-cluster:in-cluster"] } as Partial<VulnerabilitiesInput>)
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });

  describe("where a finding was found", () => {
    const placeOf = async (id: number, input: Partial<VulnerabilitiesInput> = {}) =>
      (await getData(input)).findings.find((row) => idOf(row.url) === id)?.place;

    it("names the workload container, the Environment and the codebase that an Application deploys there", async () => {
      expect(await placeOf(1101)).toEqual({
        level: "runtime",
        cluster: "in-cluster",
        namespace: "demo-dev",
        workload: "deployment.demo-app",
        container: "demo-app",
        image: DEMO_IMAGE,
        version: "main",
        environment: { cdPipeline: "demo", stage: "dev" },
        codebase: "demo-app",
      });
    });

    it("names the Environment of the namespace, and no codebase, for a workload of no Application", async () => {
      expect(await placeOf(1701)).toMatchObject({ environment: { cdPipeline: "demo", stage: "dev" }, codebase: null });
    });

    it("names neither in a namespace without a Stage", async () => {
      expect(await placeOf(1401)).toMatchObject({ namespace: "argocd", environment: null, codebase: null });
    });

    it("names the codebase, the branch and the image of a CI scan", async () => {
      expect(await placeOf(2001, { level: "image" })).toEqual({
        level: "image",
        codebase: "demo-app",
        branch: "main",
        image: DEMO_IMAGE,
        version: "main-1",
      });
      expect(await placeOf(2201, { level: "code" })).toEqual({
        level: "code",
        codebase: "demo-app",
        branch: "main",
        image: null,
        version: "",
      });
    });

    it("names no codebase when the user may not list the Applications: the findings stay", async () => {
      givenPlatform(PLATFORM, { forbidden: [k8sApplicationConfig] });

      expect(await placeOf(1101)).toMatchObject({ environment: { cdPipeline: "demo", stage: "dev" }, codebase: null });
    });
  });

  describe("the states", () => {
    it("say no scan data when no test is in the scope", async () => {
      await expect(getVulnerabilities({ clusters: ["nowhere"] })).resolves.toEqual({ state: "noScanData" });
    });

    it("say the list is empty, not missing, when the tests of the scope hold no active finding", async () => {
      const result = await getData({ level: "code", codebase: "clean-app" });

      expect(result).toMatchObject({ total: 0, findings: [] });
    });

    it("look for no test when a filter leaves the page empty", async () => {
      const defectDojo = givenDefectDojo();
      const hasTests = vi.spyOn(defectDojo, "hasTests");

      const result = await getData({ level: "image", severity: "Info" });

      expect(result.total).toBe(0);
      expect(hasTests).not.toHaveBeenCalled();
    });

    it.each([
      ["URL", "DEFECTDOJO_URL"],
      ["token", "DEFECTDOJO_TOKEN"],
    ])("say DefectDojo is not configured without the %s, and read nothing from the cluster", async (_, variable) => {
      vi.stubEnv(variable, "");
      vi.mocked(K8sClient).mockClear();

      await expect(getVulnerabilities()).resolves.toEqual({ state: "notConfigured" });
      expect(K8sClient).not.toHaveBeenCalled();
    });

    it.each(["unreachable", "notConfigured"] as const)("say DefectDojo is %s when the client does", async (outage) => {
      givenDefectDojo({ outage });

      await expect(getVulnerabilities()).resolves.toEqual({ state: outage });
    });
  });
});
