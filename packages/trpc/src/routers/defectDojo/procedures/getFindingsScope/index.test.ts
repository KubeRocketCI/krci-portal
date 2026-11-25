import { k8sStageConfig, type FindingsScope } from "@my-project/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockedContext } from "../../../../__mocks__/context.js";
import { K8sClient } from "../../../../clients/k8s/index.js";
import { createCaller } from "../../../index.js";
import {
  DEMO_NAMESPACE,
  createFakeDefectDojo,
  givenCluster,
  makeNamespaceProduct,
  makeStage,
  type FakeDefectDojo,
  type FakeDefectDojoOptions,
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

const DEV_STAGE = makeStage({ name: "dev", namespace: "demo-dev" });
const PROD_STAGE = makeStage({ name: "prod", clusterName: "remote-cluster", namespace: "demo-prod", order: 1 });

describe("defectDojo.getFindingsScope", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  async function getScope(): Promise<FindingsScope> {
    return createCaller(mockContext).defectDojo.getFindingsScope({ namespace: DEMO_NAMESPACE });
  }

  async function getData(): Promise<Extract<FindingsScope, { state: "data" }>> {
    const result = await getScope();
    if (result.state !== "data") {
      throw new Error(`Expected data, got ${result.state}`);
    }
    return result;
  }

  beforeEach(() => {
    mockContext = createMockedContext();
    vi.stubEnv("DEFECTDOJO_URL", "http://defectdojo.example.test");
    vi.stubEnv("DEFECTDOJO_TOKEN", "service-token");
    givenCluster([DEV_STAGE, PROD_STAGE]);
    givenDefectDojo({
      products: [
        makeNamespaceProduct(1, "in-cluster", "argocd"),
        makeNamespaceProduct(4, "in-cluster", "demo-dev", [
          "app.edp.epam.com/tenant:krci",
          "k8s-cluster:in-cluster",
          "k8s-namespace:demo-dev",
        ]),
        makeNamespaceProduct(9, "edge", "ingress"),
      ],
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    doubles.defectDojo = null;
  });

  it("starts on the clusters of the installation's Stages", async () => {
    const scope = await getData();

    expect(scope.stageClusters).toEqual(["in-cluster", "remote-cluster"]);
  });

  it("offers every cluster and namespace that a Stage or a namespace product names, each with its Environment", async () => {
    const scope = await getData();

    expect(scope.clusters).toEqual(["edge", "in-cluster", "remote-cluster"]);
    expect(scope.namespaces).toEqual([
      { cluster: "edge", namespace: "ingress", environment: null },
      { cluster: "in-cluster", namespace: "argocd", environment: null },
      { cluster: "in-cluster", namespace: "demo-dev", environment: { cdPipeline: "demo", stage: "dev" } },
      { cluster: "remote-cluster", namespace: "demo-prod", environment: { cdPipeline: "demo", stage: "prod" } },
    ]);
  });

  it("names the first Environment by CDPipeline and order when two Stages deploy to one namespace", async () => {
    givenCluster([
      makeStage({ cdPipeline: "zeta", name: "dev", namespace: "shared" }),
      makeStage({ cdPipeline: "alpha", name: "qa", namespace: "shared", order: 2 }),
      makeStage({ cdPipeline: "alpha", name: "dev", namespace: "shared", order: 1 }),
    ]);

    const scope = await getData();

    expect(scope.namespaces.find((option) => option.namespace === "shared")?.environment).toEqual({
      cdPipeline: "alpha",
      stage: "dev",
    });
  });

  it("offers no namespace for a product without both tags of a namespace product", async () => {
    givenDefectDojo({ products: [makeNamespaceProduct(3, "in-cluster", "krci", ["k8s-cluster:in-cluster"])] });

    const scope = await getData();

    expect(scope.namespaces.map((option) => option.namespace)).toEqual(["demo-dev", "demo-prod"]);
  });

  it("has no Stage cluster without a Stage: the namespace products still give the options", async () => {
    givenCluster([]);

    const scope = await getData();

    expect(scope.stageClusters).toEqual([]);
    expect(scope.clusters).toEqual(["edge", "in-cluster"]);
  });

  it.each([
    ["does not serve the Stage API", { notServed: [k8sStageConfig] }],
    ["may not list the Stages", { forbidden: [k8sStageConfig] }],
  ])("counts no Stage when the cluster %s", async (_, options) => {
    givenCluster([DEV_STAGE], options);

    const scope = await getData();

    expect(scope.stageClusters).toEqual([]);
    expect(scope.namespaces.map((option) => option.environment)).toEqual([null, null, null]);
  });

  it("offers the Stages alone when DefectDojo holds no namespace product", async () => {
    givenDefectDojo();

    const scope = await getData();

    expect(scope.clusters).toEqual(["in-cluster", "remote-cluster"]);
    expect(scope.namespaces.map((option) => option.namespace)).toEqual(["demo-dev", "demo-prod"]);
  });

  it.each([
    ["URL", "DEFECTDOJO_URL"],
    ["token", "DEFECTDOJO_TOKEN"],
  ])("says DefectDojo is not configured without the %s, and reads nothing from the cluster", async (_, variable) => {
    vi.stubEnv(variable, "");
    vi.mocked(K8sClient).mockClear();

    await expect(getScope()).resolves.toEqual({ state: "notConfigured" });
    expect(K8sClient).not.toHaveBeenCalled();
  });

  it.each(["unreachable", "notConfigured"] as const)("says DefectDojo is %s when the client does", async (outage) => {
    givenDefectDojo({ outage });

    await expect(getScope()).resolves.toEqual({ state: outage });
  });
});
