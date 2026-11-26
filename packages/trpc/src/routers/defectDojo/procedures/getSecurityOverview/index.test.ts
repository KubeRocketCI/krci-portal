import {
  TRIAGED_RUNTIME_SCAN_LIMIT,
  runtimeLines,
  type DefectDojoSeverity,
  type SecurityOverview,
  type SecurityOverviewInput,
} from "@my-project/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockedContext } from "../../../../__mocks__/context.js";
import type { DefectDojoProduct, DefectDojoTest } from "../../../../clients/defectDojo/index.js";
import { K8sClient } from "../../../../clients/k8s/index.js";
import { createCaller } from "../../../index.js";
import {
  DEMO_NAMESPACE,
  createFakeDefectDojo,
  findingOf,
  givenCluster,
  makeFindingsOf,
  makeNamespaceProduct,
  makeRuntimeTest,
  makeStage,
  type FakeDefectDojo,
  type FakeDefectDojoOptions,
} from "../../__fixtures__/testDoubles.js";
import { clearSecurityOverviewCache } from "../../securityOverview/cache.js";

const doubles = vi.hoisted(() => ({ defectDojo: null as FakeDefectDojo | null }));

vi.mock("../../../../clients/defectDojo/index.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../clients/defectDojo/index.js")>()),
  createDefectDojoClient: () => doubles.defectDojo,
}));

vi.mock("../../../../clients/k8s/index.js", () => ({ K8sClient: vi.fn() }));

const DEV = makeNamespaceProduct(4, "in-cluster", "demo-dev", [
  "app.edp.epam.com/tenant:krci",
  "k8s-cluster:in-cluster",
  "k8s-namespace:demo-dev",
]);
const ARGOCD = makeNamespaceProduct(1, "in-cluster", "argocd");

/** A runtime test of a namespace product: its findings belong to that product. */
function runtimeTestOf(
  product: DefectDojoProduct,
  id: number,
  overrides: Parameters<typeof makeRuntimeTest>[0] = { id }
) {
  const [cluster, namespace] = product.name.split("/");
  return makeRuntimeTest({
    ...overrides,
    id,
    cluster,
    namespace,
    product: { id: product.id, name: product.name, url: product.url },
  });
}

const DEV_VULNERABILITIES = runtimeTestOf(DEV, 10);
const DEV_SECRETS = runtimeTestOf(DEV, 11, { id: 11, reportKind: "exposedsecretreport" });

function givenDefectDojo(options: FakeDefectDojoOptions = {}): FakeDefectDojo {
  doubles.defectDojo = createFakeDefectDojo({
    products: [ARGOCD, DEV],
    tests: [DEV_VULNERABILITIES, DEV_SECRETS],
    findings: {
      10: makeFindingsOf(DEV_VULNERABILITIES, ["Critical", "High", "High", "Low"]),
      11: makeFindingsOf(DEV_SECRETS, ["High"]),
    },
    ...options,
  });
  return doubles.defectDojo;
}

describe("defectDojo.getSecurityOverview", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  async function getOverview(input: Partial<SecurityOverviewInput> = {}): Promise<SecurityOverview> {
    return createCaller(mockContext).defectDojo.getSecurityOverview({ namespace: DEMO_NAMESPACE, ...input });
  }

  async function getData(input: Partial<SecurityOverviewInput> = {}) {
    const result = await getOverview(input);
    if (result.state !== "data") {
      throw new Error(`Expected data, got ${result.state}`);
    }
    return result;
  }

  beforeEach(() => {
    mockContext = createMockedContext();
    vi.stubEnv("DEFECTDOJO_URL", "http://defectdojo.example.test");
    vi.stubEnv("DEFECTDOJO_TOKEN", "service-token");
    givenCluster([makeStage({ name: "dev", namespace: "demo-dev" })]);
    givenDefectDojo();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    clearSecurityOverviewCache();
    doubles.defectDojo = null;
  });

  describe("the counts of a namespace", () => {
    it("are the active findings of its namespace product by severity, the exposed secrets counted apart", async () => {
      const { namespaces } = await getData();

      expect(namespaces.find((row) => row.namespace === "demo-dev")?.product).toEqual({
        url: DEV.url,
        vulnerabilities: { Critical: 1, High: 2, Medium: 0, Low: 1, Info: 0 },
        secrets: { Critical: 0, High: 1, Medium: 0, Low: 0, Info: 0 },
      });
    });

    it("are none for a Stage namespace without a namespace product: no scan data, not zero", async () => {
      givenCluster([
        makeStage({ name: "dev", namespace: "demo-dev" }),
        makeStage({ name: "prod", clusterName: "remote-cluster", namespace: "demo-prod", order: 1 }),
      ]);

      const { namespaces } = await getData();

      expect(namespaces.find((row) => row.namespace === "demo-prod")).toEqual({
        cluster: "remote-cluster",
        namespace: "demo-prod",
        environment: { cdPipeline: "demo", stage: "prod" },
        managed: false,
        product: null,
      });
    });
  });

  describe("the totals of the Runtime level", () => {
    it("add the vulnerabilities and, apart, the exposed secrets of the namespaces with a namespace product", async () => {
      givenCluster([
        makeStage({ name: "dev", namespace: "demo-dev" }),
        makeStage({ name: "prod", clusterName: "remote-cluster", namespace: "demo-prod", order: 1 }),
      ]);

      const { namespaces } = await getData();

      expect(runtimeLines(namespaces)).toEqual({
        size: 2,
        vulnerabilities: { Critical: 1, High: 2, Medium: 0, Low: 1, Info: 0 },
        secrets: { Critical: 0, High: 1, Medium: 0, Low: 0, Info: 0 },
      });
    });
  });

  describe("the order of the namespaces", () => {
    it("is by cluster; in each, the Environments and the managed namespaces first, then the others, most severe first", async () => {
      const OTHER = makeNamespaceProduct(6, "in-cluster", "other-dev", [
        "app.edp.epam.com/tenant:other",
        "k8s-cluster:in-cluster",
        "k8s-namespace:other-dev",
      ]);
      const QA = makeNamespaceProduct(5, "in-cluster", "demo-qa", [
        "app.edp.epam.com/tenant:krci",
        "k8s-cluster:in-cluster",
        "k8s-namespace:demo-qa",
      ]);
      const EDGE = makeNamespaceProduct(9, "edge", "ingress");
      const tests = [
        runtimeTestOf(ARGOCD, 20),
        runtimeTestOf(OTHER, 21),
        runtimeTestOf(QA, 22),
        runtimeTestOf(EDGE, 23),
      ];
      givenDefectDojo({
        products: [ARGOCD, DEV, OTHER, QA, EDGE],
        tests: [DEV_VULNERABILITIES, ...tests],
        findings: {
          10: makeFindingsOf(DEV_VULNERABILITIES, ["High"]),
          20: makeFindingsOf(tests[0], ["Critical", "Critical"]),
          21: makeFindingsOf(tests[1], ["Critical", "High"]),
          22: makeFindingsOf(tests[2], ["Critical", "Critical", "Critical"]),
          23: makeFindingsOf(tests[3], ["Low"]),
        },
      });

      const { namespaces } = await getData();

      expect(namespaces.map(({ cluster, namespace, managed }) => [cluster, namespace, managed])).toEqual([
        ["edge", "ingress", false],
        ["in-cluster", "demo-qa", true],
        ["in-cluster", "demo-dev", true],
        ["in-cluster", "argocd", false],
        ["in-cluster", "other-dev", false],
      ]);
    });
  });

  describe("the reads of DefectDojo", () => {
    it("serve every caller from one read: the next caller asks DefectDojo nothing and gets its own Environments", async () => {
      const defectDojo = givenDefectDojo();
      const reads = [
        vi.spyOn(defectDojo, "listProductsWithTagText"),
        vi.spyOn(defectDojo, "getSeverityCounts"),
        vi.spyOn(defectDojo, "listFindings"),
      ];

      const first = await getData();
      givenCluster([]);
      mockContext = createMockedContext();
      const next = await getData();

      // One list of products, a count per namespace product, one list of the exposed secrets.
      expect(reads.map((read) => read.mock.calls.length)).toEqual([1, 2, 1]);
      expect(first.namespaces.find((row) => row.namespace === "demo-dev")?.environment).toEqual({
        cdPipeline: "demo",
        stage: "dev",
      });
      expect(next.namespaces.find((row) => row.namespace === "demo-dev")?.environment).toBeNull();
      expect(next.namespaces.map((row) => row.product)).toEqual(first.namespaces.map((row) => row.product));
    });

    it("are kept apart for each state", async () => {
      const counts = vi.spyOn(givenDefectDojo(), "getSeverityCounts");

      await getData();
      await getData({ state: "falsePositive" });

      expect(counts.mock.calls.map(([, options]) => options?.state)).toEqual([
        "active",
        "active",
        "falsePositive",
        "falsePositive",
      ]);
    });
  });

  describe("a triaged state", () => {
    it("counts the findings of that state; a secret of a closed test is no vulnerability and is not shown, as on the lists", async () => {
      const CLOSED_SECRETS = runtimeTestOf(DEV, 12, { id: 12, reportKind: "exposedsecretreport", buildId: "" });
      const falsePositive = (test: DefectDojoTest, id: number, severity: DefectDojoSeverity) =>
        findingOf(id, test.id, severity, {
          product: { id: test.product.id, url: test.product.url },
          active: false,
          falsePositive: true,
        });
      givenDefectDojo({
        tests: [DEV_VULNERABILITIES, DEV_SECRETS, CLOSED_SECRETS],
        findings: {
          10: [...makeFindingsOf(DEV_VULNERABILITIES, ["High"]), falsePositive(DEV_VULNERABILITIES, 1090, "Critical")],
          11: [falsePositive(DEV_SECRETS, 1190, "High")],
          12: [falsePositive(CLOSED_SECRETS, 1290, "Medium")],
        },
      });

      const { namespaces } = await getData({ state: "falsePositive" });

      expect(namespaces.find((row) => row.namespace === "demo-dev")?.product).toMatchObject({
        vulnerabilities: { Critical: 1, High: 0, Medium: 0, Low: 0, Info: 0 },
        secrets: { Critical: 0, High: 1, Medium: 0, Low: 0, Info: 0 },
      });
    });

    it(`reads at most ${TRIAGED_RUNTIME_SCAN_LIMIT} exposed secrets, says so, and counts the others as vulnerabilities`, async () => {
      givenDefectDojo({
        findings: {
          10: makeFindingsOf(DEV_VULNERABILITIES, ["High", "High"]),
          11: makeFindingsOf(
            DEV_SECRETS,
            Array.from({ length: TRIAGED_RUNTIME_SCAN_LIMIT + 10 }, () => "High" as const)
          ),
        },
      });

      const result = await getData();

      expect(result.secretsTruncated).toBe(true);
      expect(result.namespaces.find((row) => row.namespace === "demo-dev")?.product).toMatchObject({
        vulnerabilities: { High: 12 },
        secrets: { High: TRIAGED_RUNTIME_SCAN_LIMIT },
      });
    });

    it("rejects Mitigated: every finding of a closed runtime test is mitigated", async () => {
      await expect(
        getOverview({ state: "mitigated" } as unknown as Partial<SecurityOverviewInput>)
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });

  describe("the states", () => {
    it.each([
      ["URL", "DEFECTDOJO_URL"],
      ["token", "DEFECTDOJO_TOKEN"],
    ])("say DefectDojo is not configured without the %s, and read nothing from the cluster", async (_, variable) => {
      vi.stubEnv(variable, "");
      vi.mocked(K8sClient).mockClear();

      await expect(getOverview()).resolves.toEqual({ state: "notConfigured" });
      expect(K8sClient).not.toHaveBeenCalled();
    });

    it("say no scan data when DefectDojo holds no namespace product", async () => {
      givenDefectDojo({ products: [makeNamespaceProduct(3, "in-cluster", "krci", ["k8s-cluster:in-cluster"])] });

      await expect(getOverview()).resolves.toEqual({ state: "noScanData" });
    });

    it("say DefectDojo is unreachable, and ask it again on the next call: an outage is not kept", async () => {
      givenDefectDojo({ outage: "unreachable", outageOn: ["getSeverityCounts"] });
      await expect(getOverview()).resolves.toEqual({ state: "unreachable" });

      givenDefectDojo();
      await expect(getOverview()).resolves.toMatchObject({ state: "data" });
    });
  });
});
