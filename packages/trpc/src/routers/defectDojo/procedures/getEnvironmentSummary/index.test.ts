import {
  K8sApiError,
  NO_FINDING_COUNTS,
  TRIAGED_RUNTIME_SCAN_LIMIT,
  k8sApplicationConfig,
  type EnvironmentSummary,
  type EnvironmentSummaryInput,
  type SeverityCounts,
} from "@my-project/shared";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { createMockedContext } from "../../../../__mocks__/context.js";
import { K8sClient } from "../../../../clients/k8s/index.js";
import { createCaller } from "../../../index.js";
import type { DefectDojoProduct, DefectDojoTest } from "../../../../clients/defectDojo/index.js";
import {
  DEMO_IMAGE,
  DEMO_NAMESPACE,
  createFakeDefectDojo,
  givenCluster,
  makeApplication,
  makeFindingsOf,
  makeNamespaceProduct,
  makeRuntimeTest,
  makeStage,
  makeTest,
  TRIVY,
  type FakeDefectDojo,
  type FakeDefectDojoOptions,
  type RuntimeTestOverrides,
} from "../../__fixtures__/testDoubles.js";

const doubles = vi.hoisted(() => ({ defectDojo: null as FakeDefectDojo | null }));

vi.mock("../../../../clients/defectDojo/index.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../clients/defectDojo/index.js")>()),
  createDefectDojoClient: () => doubles.defectDojo,
}));

vi.mock("../../../../clients/k8s/index.js", () => ({ K8sClient: vi.fn() }));

function givenDefectDojo(options: FakeDefectDojoOptions = {}): FakeDefectDojo {
  doubles.defectDojo = createFakeDefectDojo(options);
  return doubles.defectDojo;
}

/** The namespace product of the Stage `demo` / `dev`. */
const DEV = makeNamespaceProduct(4, "in-cluster", "demo-dev");
const QA = makeNamespaceProduct(5, "in-cluster", "demo-qa");

/** A runtime test of the dev namespace: its findings belong to the namespace product. */
function devTest(id: number, overrides: Omit<RuntimeTestOverrides, "id"> = {}, product: DefectDojoProduct = DEV) {
  return makeRuntimeTest({ ...overrides, id, product: { id: product.id, name: product.name, url: product.url } });
}

function givenTests(findingsByTest: [DefectDojoTest, Parameters<typeof makeFindingsOf>[1]][]): FakeDefectDojo {
  return givenDefectDojo({
    tests: findingsByTest.map(([test]) => test),
    findings: Object.fromEntries(
      findingsByTest.map(([test, severities]) => [test.id, makeFindingsOf(test, severities)])
    ),
  });
}

const counts = (found: Partial<SeverityCounts>): SeverityCounts => ({ ...NO_FINDING_COUNTS, ...found });

describe("defectDojo.getEnvironmentSummary", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  async function getSummary(input: Partial<EnvironmentSummaryInput> = {}): Promise<EnvironmentSummary> {
    return createCaller(mockContext).defectDojo.getEnvironmentSummary({
      namespace: DEMO_NAMESPACE,
      cdPipeline: "demo",
      stage: "dev",
      ...input,
    });
  }

  async function getData(input: Partial<EnvironmentSummaryInput> = {}) {
    const result = await getSummary(input);
    if (result.state !== "data") {
      throw new Error(`Expected data, got ${result.state}`);
    }
    return result;
  }

  beforeEach(() => {
    mockContext = createMockedContext();
    vi.stubEnv("DEFECTDOJO_URL", "http://defectdojo.example.test");
    vi.stubEnv("DEFECTDOJO_TOKEN", "service-token");
    givenCluster([makeStage(), makeApplication()]);
    givenDefectDojo();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    doubles.defectDojo = null;
  });

  describe("states", () => {
    it.each([
      ["URL", "DEFECTDOJO_URL"],
      ["token", "DEFECTDOJO_TOKEN"],
    ])("is not configured without the DefectDojo %s, and reads nothing from the cluster", async (_, variable) => {
      vi.stubEnv(variable, "");
      // The mocked context built a client of its own.
      vi.mocked(K8sClient).mockClear();

      expect(await getSummary()).toEqual({ state: "notConfigured" });
      expect(K8sClient).not.toHaveBeenCalled();
    });

    it("has no scan data when the security operator has reported no runtime test of the Stage's namespace", async () => {
      expect(await getSummary()).toEqual({ state: "noScanData" });
    });
  });

  describe("an application of the Stage", () => {
    it("shows the active vulnerabilities by severity and the exposed secrets of its container, and the summary the same apart", async () => {
      givenTests([
        [devTest(10), ["Critical", "High", "High", "Low"]],
        [devTest(11, { reportKind: "exposedsecretreport" }), ["High"]],
      ]);

      expect(await getSummary()).toEqual({
        state: "data",
        place: { cluster: "in-cluster", namespace: "demo-dev" },
        runtime: {
          state: "data",
          url: DEV.url,
          vulnerabilities: counts({ Critical: 1, High: 2, Low: 1 }),
          secrets: counts({ High: 1 }),
          secretsTruncated: false,
          lastUpload: "2026-11-23T10:00:00Z",
        },
        containers: { scanned: 1, withoutCodebase: 0, notRunning: 0 },
        applications: [
          {
            codebase: "demo-app",
            state: "data",
            containers: [
              {
                workload: "deployment.demo-app",
                container: "demo-app",
                image: DEMO_IMAGE,
                state: "running",
                vulnerabilities: counts({ Critical: 1, High: 2, Low: 1 }),
                secrets: 1,
              },
            ],
          },
        ],
      });
    });

    it("is clean when its running containers hold no active finding, and the summary says so with the last upload", async () => {
      givenTests([
        [devTest(10, { updated: "2026-11-24T08:00:00Z" }), []],
        [devTest(11, { reportKind: "exposedsecretreport" }), []],
      ]);

      const { runtime, applications } = await getData();

      expect(runtime).toEqual({ state: "clean", url: DEV.url, lastUpload: "2026-11-24T08:00:00Z" });
      expect(applications?.[0]).toMatchObject({ codebase: "demo-app", state: "clean" });
    });

    it("has no scan data when no container carries its Application", async () => {
      givenTests([[devTest(10, { application: null }), ["High"]]]);

      expect((await getData()).applications).toEqual([{ codebase: "demo-app", state: "noScanData", containers: [] }]);
    });

    it("is not running when every test of its containers is closed, which then counts nothing", async () => {
      givenTests([
        [devTest(10, { buildId: "" }), ["High"]],
        [devTest(20, { application: null, workload: "deployment.redis", container: "redis" }), ["Low"]],
      ]);

      const { applications, containers } = await getData();

      expect(applications).toEqual([
        {
          codebase: "demo-app",
          state: "notRunning",
          containers: [
            { workload: "deployment.demo-app", container: "demo-app", image: DEMO_IMAGE, state: "notRunning" },
          ],
        },
      ]);
      expect(containers).toEqual({ scanned: 1, withoutCodebase: 1, notRunning: 1 });
    });

    it("has one line per container when the codebase runs several, a closed one among them", async () => {
      givenTests([
        [devTest(10), ["High"]],
        [devTest(20, { workload: "deployment.worker", container: "worker" }), []],
        [devTest(30, { workload: "deployment.old", container: "old", buildId: "" }), ["Critical"]],
      ]);

      const [application] = (await getData()).applications ?? [];

      expect(application.state).toBe("data");
      expect(
        application.containers.map((container) =>
          container.state === "running"
            ? [container.container, container.state, container.vulnerabilities]
            : [container.container, container.state]
        )
      ).toEqual([
        ["demo-app", "running", counts({ High: 1 })],
        ["worker", "running", counts({})],
        ["old", "notRunning"],
      ]);
    });

    it("takes the first of two Applications of one codebase by name, as the codebase tab does", async () => {
      givenCluster([
        makeStage(),
        makeApplication({ name: "demo-dev-demo-app-b" }),
        makeApplication({ name: "demo-dev-demo-app-a" }),
      ]);
      givenTests([
        [devTest(10, { application: "demo-dev-demo-app-a" }), ["High"]],
        [devTest(20, { application: "demo-dev-demo-app-b", workload: "deployment.b", container: "b" }), ["Low"]],
      ]);

      const { applications } = await getData();

      expect(applications?.map(({ codebase, containers }) => [codebase, containers.map((c) => c.container)])).toEqual([
        ["demo-app", ["demo-app"]],
      ]);
    });
  });

  describe("the workloads of the namespace", () => {
    it("counts a running container without a codebase in the summary and in no cell", async () => {
      givenCluster([makeStage(), makeApplication(), makeApplication({ name: "demo-dev-unlabelled", codebase: null })]);
      givenTests([
        [devTest(10), ["High"]],
        [devTest(20, { application: null, workload: "deployment.redis", container: "redis" }), ["Low"]],
        [devTest(30, { application: "gone-app", workload: "deployment.nginx", container: "nginx" }), ["Medium"]],
        [devTest(40, { application: "demo-dev-unlabelled", workload: "deployment.job", container: "job" }), []],
      ]);

      const { containers, applications, runtime } = await getData();

      expect(containers).toEqual({ scanned: 4, withoutCodebase: 3, notRunning: 0 });
      expect(applications?.map((application) => application.containers.length)).toEqual([1]);
      expect(runtime).toMatchObject({ state: "data", vulnerabilities: counts({ High: 1, Medium: 1, Low: 1 }) });
    });

    it("gives a workload of another Stage in the same namespace its codebase, though no cell of this Stage", async () => {
      givenCluster([
        makeStage(),
        makeStage({ name: "shadow", namespace: "demo-dev", order: 1 }),
        makeApplication(),
        makeApplication({ name: "demo-shadow-other-app", codebase: "other-app", stage: "shadow" }),
      ]);
      givenTests([
        [devTest(10), ["High"]],
        [devTest(30, { application: "demo-shadow-other-app", workload: "deployment.other", container: "other" }), []],
      ]);

      const { containers, applications } = await getData();

      expect(containers).toEqual({ scanned: 2, withoutCodebase: 0, notRunning: 0 });
      expect(applications?.map((application) => application.codebase)).toEqual(["demo-app"]);
    });

    it("is not running when every runtime test of the namespace is closed, and reads no count", async () => {
      const defectDojo = givenTests([[devTest(10, { buildId: "" }), ["High"]]]);
      const countsRead = vi.spyOn(defectDojo, "getSeverityCounts");
      const listsRead = vi.spyOn(defectDojo, "listFindings");

      const { runtime } = await getData();

      expect(runtime).toEqual({ state: "notRunning", url: DEV.url });
      expect(countsRead).not.toHaveBeenCalled();
      expect(listsRead).not.toHaveBeenCalled();
    });

    it("links the product of the open tests when a closed test of another product is listed first", async () => {
      const renamed = makeNamespaceProduct(9, "x-in-cluster", "demo-dev");
      givenTests([
        [devTest(9, { buildId: "" }, renamed), ["High"]],
        [devTest(10), ["Low"]],
      ]);

      expect((await getData()).runtime).toMatchObject({ state: "data", url: DEV.url });
    });

    it("links the product of the newest test when every runtime test is closed", async () => {
      const renamed = makeNamespaceProduct(9, "x-in-cluster", "demo-dev");
      givenTests([
        [devTest(9, { buildId: "", updated: "2026-11-20T10:00:00Z" }, renamed), ["High"]],
        [devTest(10, { buildId: "", updated: "2026-11-23T10:00:00Z" }), ["Low"]],
      ]);

      expect((await getData()).runtime).toEqual({ state: "notRunning", url: DEV.url });
    });

    it("counts runtime tests only: a CI scan that carries the namespace tags adds no product", async () => {
      const ciScan = makeTest({
        id: 50,
        scanType: TRIVY,
        tags: ["k8s-cluster:in-cluster", "k8s-namespace:demo-dev", `oci-image:${DEMO_IMAGE}`],
      });
      givenTests([
        [devTest(10), ["Low"]],
        [ciScan, ["Critical", "Critical", "Critical"]],
      ]);

      expect((await getData()).runtime).toMatchObject({ state: "data", vulnerabilities: counts({ Low: 1 }) });
    });

    it("counts only the exposed secrets of the Stage's namespace", async () => {
      givenTests([
        [devTest(10), ["Low"]],
        [devTest(11, { reportKind: "exposedsecretreport" }), ["High"]],
        [devTest(12, { namespace: "demo-qa", reportKind: "exposedsecretreport" }, QA), ["Critical", "Critical"]],
      ]);

      expect((await getData()).runtime).toMatchObject({
        state: "data",
        vulnerabilities: counts({ Low: 1 }),
        secrets: counts({ High: 1 }),
      });
    });

    it("counts the exposed secrets apart from one bounded list, and says when it is cut", async () => {
      const secrets = Array.from({ length: TRIAGED_RUNTIME_SCAN_LIMIT + 1 }, () => "High" as const);
      givenTests([
        [devTest(10), ["Low"]],
        [devTest(11, { reportKind: "exposedsecretreport" }), secrets],
      ]);

      const { runtime } = await getData();

      expect(runtime).toMatchObject({
        state: "data",
        vulnerabilities: counts({ High: 1, Low: 1 }),
        secrets: counts({ High: TRIAGED_RUNTIME_SCAN_LIMIT }),
        secretsTruncated: true,
      });
    });
  });

  describe("the Stage and its Applications", () => {
    it("reads the namespace of a Stage on a remote cluster by the cluster tag in lower case", async () => {
      givenCluster([
        makeStage({ name: "prod", clusterName: "Remote-Cluster", namespace: "demo-prod" }),
        makeApplication({ name: "demo-prod-demo-app", stage: "prod" }),
      ]);
      givenTests([
        [
          devTest(10, { cluster: "remote-cluster", namespace: "demo-prod", application: "demo-prod-demo-app" }),
          ["High"],
        ],
      ]);

      const { place, applications } = await getData({ stage: "prod" });

      expect(place).toEqual({ cluster: "remote-cluster", namespace: "demo-prod" });
      expect(applications?.map(({ codebase, state }) => [codebase, state])).toEqual([["demo-app", "data"]]);
    });

    it("keeps the counts but tells nothing of codebases when the user may not list the Applications", async () => {
      givenCluster([makeStage(), makeApplication()], { forbidden: [k8sApplicationConfig] });
      givenTests([[devTest(10), ["High"]]]);

      const { applications, containers, runtime } = await getData();

      expect(applications).toBeNull();
      expect(containers).toEqual({ scanned: 1, withoutCodebase: null, notRunning: 0 });
      expect(runtime).toMatchObject({ state: "data", vulnerabilities: counts({ High: 1 }) });
    });

    it("rejects a caller who may not read the Stage with FORBIDDEN, before it asks DefectDojo", async () => {
      const listTests = vi.spyOn(givenTests([[devTest(10), ["High"]]]), "listTests");
      (K8sClient as unknown as Mock).mockImplementation(function () {
        return {
          KubeConfig: {},
          async getResource() {
            throw new K8sApiError(403, "Forbidden", "stages is forbidden");
          },
          async listResource() {
            return { items: [] };
          },
        };
      });

      await expect(getSummary()).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(listTests).not.toHaveBeenCalled();
    });

    it("answers NOT_FOUND for a Stage that does not exist", async () => {
      await expect(getSummary({ stage: "missing" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("DefectDojo", () => {
    it.each(["unreachable", "notConfigured"] as const)("is %s when any read is: no partial data", async (outage) => {
      givenDefectDojo({
        tests: [devTest(10), devTest(11, { reportKind: "exposedsecretreport" })],
        outage,
        outageOn: ["getSeverityCounts"],
      });

      expect(await getSummary()).toEqual({ state: outage });
    });

    it("costs the tests list, one count of the product, the secrets list and a count per open test of the Stage's own Applications", async () => {
      const defectDojo = givenTests([
        [devTest(10), ["High"]],
        [devTest(11, { reportKind: "exposedsecretreport" }), ["High"]],
        [devTest(20, { application: null, workload: "deployment.redis", container: "redis" }), ["Low"]],
        [devTest(21, { application: null, workload: "deployment.nginx", container: "nginx" }), ["Low"]],
      ]);
      const reads = [
        vi.spyOn(defectDojo, "listTests"),
        vi.spyOn(defectDojo, "getSeverityCounts"),
        vi.spyOn(defectDojo, "listFindings"),
      ];

      await getData();

      // At most 3 + the two open tests of demo-app: the workloads without a codebase cost no request of their own.
      expect(reads.reduce((total, read) => total + read.mock.calls.length, 0)).toBeLessThanOrEqual(5);
    });
  });
});
