import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { K8sApiError } from "@my-project/shared";
import { createMockedContext } from "../../__mocks__/context.js";
import type {
  DefectDojoPrefetchedEngagement,
  DefectDojoTest,
  DefectDojoTestsResult,
} from "../../clients/defectdojo/index.js";
import { K8sClient } from "../../clients/k8s/index.js";
import type { AuthorizedStage } from "./authorization.js";
import { createTestClient, WEB_URL } from "./__fixtures__/defectdojo.js";
import { AUTHORIZED_DEV_STAGE, DEMO_IMAGES, DEMO_LISTS, listByKind } from "./__fixtures__/kubernetes.js";
import {
  classifyTests,
  codebaseFindingsFilter,
  engagementIdsOf,
  imagesByCodebase,
  imageTagsOf,
  loadNamespaceRuntimes,
  loadRuntimeContext,
  loadRuntimeInput,
  namespaceLink,
  otherFindingsFilter,
  resolveEnvironmentTarget,
  resolveEnvironmentTargets,
  testsRunningImages,
  workloadsOfTests,
  type EnvironmentTarget,
  type NamespaceRuntime,
} from "./runtime.js";

vi.mock("../../clients/k8s/index.js", () => ({ K8sClient: vi.fn() }));

function runtimeTest(id: number, image: string | undefined, overrides: Partial<DefectDojoTest> = {}): DefectDojoTest {
  return {
    id,
    title: `VulnerabilityReport deployment/app-${id}/app`,
    engagement: 4,
    tags: [
      "k8s-cluster:in-cluster",
      "k8s-namespace:krci-demo-dev",
      `k8s-workload:deployment.app-${id}`,
      ...(image ? [`oci-image:${image}`] : []),
    ],
    ...overrides,
  };
}

function stream(codebase: string, imageName: string) {
  return { spec: { codebase, imageName } };
}

function engagementOf(id: number): DefectDojoPrefetchedEngagement {
  return { id, name: "trivy-operator", product: { id: 3, name: "in-cluster/krci-demo-dev" } };
}

describe("imagesByCodebase", () => {
  it("groups the image tags by codebase, once each, and leaves out a stream without an image name", () => {
    expect(
      imagesByCodebase([
        stream("checkout", "registry.example.com/shop/checkout"),
        stream("checkout", "Registry.Example.com/shop/checkout:1.0.0"),
        stream("proxy", "docker.io/library/nginx"),
        stream("unnamed", " "),
      ])
    ).toEqual(
      new Map([
        ["checkout", new Set(["oci-image:registry.example.com/shop/checkout"])],
        ["proxy", new Set(["oci-image:nginx"])],
      ])
    );
  });
});

describe("resolveEnvironmentTarget", () => {
  const client = createTestClient({ clusterName: "core" });

  const base: AuthorizedStage = {
    cdPipeline: "demo",
    stage: "dev",
    clusterName: "in-cluster",
    namespace: "krci-demo-dev",
    available: true,
  };

  it.each([["in-cluster"], [""]])("puts a Stage of the cluster name %j on the cluster of the portal", (clusterName) => {
    expect(resolveEnvironmentTarget({ ...base, clusterName }, client)).toEqual({
      environment: "demo/dev",
      cluster: "core",
      namespace: "krci-demo-dev",
    });
  });

  it("keeps the cluster name of a Stage on another cluster", () => {
    expect(resolveEnvironmentTarget({ ...base, clusterName: "eks-sandbox" }, client)).toEqual({
      environment: "demo/dev",
      cluster: "eks-sandbox",
      namespace: "krci-demo-dev",
    });
  });

  it("gives no target for a Stage that is not available", () => {
    expect(resolveEnvironmentTarget({ ...base, available: false }, client)).toBeUndefined();
  });

  it.each([
    ["an empty namespace", { namespace: "" }],
    ["a namespace with a comma", { namespace: "a,b" }],
    ["a namespace with a colon", { namespace: "a:b" }],
    ["a namespace with a slash", { namespace: "a/b" }],
    ["a namespace in upper case", { namespace: "Krci" }],
    ["a namespace with a dot", { namespace: "krci.demo" }],
    ["a namespace of 64 characters", { namespace: "a".repeat(64) }],
    ["a cluster with a comma", { clusterName: "a,b" }],
    ["a cluster with a colon", { clusterName: "eks:sandbox" }],
    ["a cluster with a slash", { clusterName: "eks/sandbox" }],
    ["a cluster in upper case", { clusterName: "EKS" }],
  ])("gives no target for %s", (_name, overrides) => {
    expect(resolveEnvironmentTarget({ ...base, ...overrides }, client)).toBeUndefined();
  });

  it("orders the targets by environment and leaves out the Stages without one", () => {
    const stage = (name: string, overrides: Partial<AuthorizedStage> = {}) => ({
      ...base,
      stage: name,
      namespace: `krci-demo-${name}`,
      ...overrides,
    });

    const targets = resolveEnvironmentTargets(
      [stage("qa"), stage("prod", { available: false }), stage("dev"), stage("bad", { namespace: "a,b" })],
      client
    );

    expect(targets.map(({ environment }) => environment)).toEqual(["demo/dev", "demo/qa"]);
  });
});

describe("loadRuntimeContext and loadRuntimeInput", () => {
  const originalEnv = process.env;
  const ctx = createMockedContext();
  const dd = { tenantTags: vi.fn((tenant: string) => ["tag-of-" + tenant]) };
  let listResource: Mock;

  beforeEach(() => {
    process.env = { ...originalEnv, DEFAULT_CLUSTER_NAMESPACE: "krci" };
    listResource = vi.fn().mockImplementation(listByKind(DEMO_LISTS));
    (K8sClient as unknown as Mock).mockImplementation(function () {
      return { KubeConfig: {}, listResource };
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it("reads the images of the codebases and builds the tenant tags of the portal namespace once", async () => {
    expect(await loadRuntimeContext(ctx, dd)).toEqual({ images: DEMO_IMAGES, tenantTags: ["tag-of-krci"] });
    expect(dd.tenantTags).toHaveBeenCalledTimes(1);
  });

  it("adds the Stages of the codebase", async () => {
    expect(await loadRuntimeInput(ctx, dd, "my-service")).toEqual({
      stages: [AUTHORIZED_DEV_STAGE],
      images: DEMO_IMAGES,
      tenantTags: ["tag-of-krci"],
    });
  });

  it("hands over what the caller may read: no Stages and no images on a 403", async () => {
    listResource.mockRejectedValue(new K8sApiError(403, "Forbidden", "forbidden"));

    expect(await loadRuntimeInput(ctx, dd, "my-service")).toEqual({
      stages: [],
      images: undefined,
      tenantTags: ["tag-of-krci"],
    });
  });
});

describe("classifyTests", () => {
  const checkout = imagesByCodebase([stream("checkout", "registry.example.com/shop/checkout")]);

  it("puts a test with the image of a codebase into the codebase and nothing else into other", () => {
    const tests = [
      runtimeTest(1, "registry.example.com/shop/checkout"),
      runtimeTest(2, "istio/proxyv2"),
      runtimeTest(3, "redis"),
    ];

    const { byCodebase, other } = classifyTests(tests, checkout);

    expect([...byCodebase.keys()]).toEqual(["checkout"]);
    expect(byCodebase.get("checkout")?.map(({ id }) => id)).toEqual([1]);
    expect(other.map(({ id }) => id)).toEqual([2, 3]);
  });

  it("matches the image of an image stream written with another host case, a port, a tag and a digest", () => {
    const images = imagesByCodebase([stream("app", "Registry.Example.com:5000/KRCI/App:1.0.0@sha256:abc")]);

    const { byCodebase, other } = classifyTests([runtimeTest(1, "registry.example.com:5000/krci/app")], images);

    expect(byCodebase.get("app")?.map(({ id }) => id)).toEqual([1]);
    expect(other).toEqual([]);
  });

  it("counts several image streams of one codebase with one image once", () => {
    const images = imagesByCodebase([
      stream("test-go-app", "registry.example.com/krci/test-go-app"),
      stream("test-go-app", "registry.example.com/krci/test-go-app"),
      stream("test-go-app", "registry.example.com/krci/test-go-app"),
    ]);

    const { byCodebase } = classifyTests([runtimeTest(1, "registry.example.com/krci/test-go-app")], images);

    expect(images.get("test-go-app")?.size).toBe(1);
    expect(byCodebase.get("test-go-app")).toHaveLength(1);
  });

  it("gives the images of all image streams of a codebase to the codebase", () => {
    const images = imagesByCodebase([
      stream("app", "registry.example.com/krci/app"),
      stream("app", "registry.example.com/krci/app-worker"),
    ]);

    const { byCodebase, other } = classifyTests(
      [runtimeTest(1, "registry.example.com/krci/app"), runtimeTest(2, "registry.example.com/krci/app-worker")],
      images
    );

    expect(byCodebase.get("app")?.map(({ id }) => id)).toEqual([1, 2]);
    expect(other).toEqual([]);
  });

  it("gives a test to each of the codebases that share its image, and not to other", () => {
    const images = imagesByCodebase([
      stream("alpha", "registry.example.com/krci/shared"),
      stream("beta", "registry.example.com/krci/shared"),
    ]);

    const { byCodebase, other } = classifyTests([runtimeTest(1, "registry.example.com/krci/shared")], images);

    expect(byCodebase.get("alpha")?.map(({ id }) => id)).toEqual([1]);
    expect(byCodebase.get("beta")?.map(({ id }) => id)).toEqual([1]);
    expect(other).toEqual([]);
  });

  it("leaves a sidecar of a codebase workload in other, next to the workload of the codebase", () => {
    const sidecar = runtimeTest(2, "istio/proxyv2", {
      tags: [...runtimeTest(2, "istio/proxyv2").tags, "k8s-container:istio-proxy"],
    });

    const { byCodebase, other } = classifyTests(
      [runtimeTest(1, "registry.example.com/shop/checkout"), sidecar],
      checkout
    );

    expect(byCodebase.get("checkout")?.map(({ id }) => id)).toEqual([1]);
    expect(other.map(({ id }) => id)).toEqual([2]);
  });

  it.each([
    ["names no image", runtimeTest(1, undefined)],
    ["runs an image that a mirror or a retag renamed", runtimeTest(1, "mirror.example.com/shop/checkout")],
    [
      "carries the image only in another tag",
      runtimeTest(1, undefined, { tags: ["k8s-container:registry.example.com/shop/checkout"] }),
    ],
  ])("leaves a test that %s in other", (_name, test) => {
    const { byCodebase, other } = classifyTests([test], checkout);

    expect(byCodebase.size).toBe(0);
    expect(other).toHaveLength(1);
  });

  it("does not match an image whose tag value the operator shortened", () => {
    const longName = `registry.example.com/${"a".repeat(300)}`;

    const { byCodebase, other } = classifyTests(
      [runtimeTest(1, `${longName.slice(0, 200)}~0123456789ab`)],
      imagesByCodebase([stream("app", longName)])
    );

    expect(byCodebase.size).toBe(0);
    expect(other).toHaveLength(1);
  });

  it("puts every test into other when no codebase has an image", () => {
    const { byCodebase, other } = classifyTests([runtimeTest(1, "nginx"), runtimeTest(2, "redis")], new Map());

    expect(byCodebase.size).toBe(0);
    expect(other).toHaveLength(2);
  });
});

describe("testsRunningImages", () => {
  it("keeps the tests whose image tag is in the set", () => {
    const tests = [runtimeTest(1, "nginx"), runtimeTest(2, "redis"), runtimeTest(3, undefined)];

    expect(testsRunningImages(tests, new Set(["oci-image:redis"])).map(({ id }) => id)).toEqual([2]);
  });
});

describe("findings filters", () => {
  const tests = [
    runtimeTest(1, "redis", { engagement: 9 }),
    runtimeTest(2, "nginx", { engagement: 4 }),
    runtimeTest(3, "nginx", { engagement: 4 }),
    runtimeTest(4, undefined, { engagement: 4 }),
  ];

  it("lists engagement ids and image tags once and sorted", () => {
    expect(engagementIdsOf(tests)).toEqual([4, 9]);
    expect(imageTagsOf(tests)).toEqual(["oci-image:nginx", "oci-image:redis"]);
  });

  it("scopes a codebase row to its engagements and images, and to the tenant tags", () => {
    expect(codebaseFindingsFilter(tests, ["k8s-ns-label.tenant:krci"])).toEqual({
      engagementIds: [4, 9],
      anyTestTags: ["oci-image:nginx", "oci-image:redis"],
      allTestTags: ["k8s-ns-label.tenant:krci"],
    });
  });

  it("scopes an other row to its engagements and excludes the images of the codebases", () => {
    expect(otherFindingsFilter([tests[3]], [tests[0], tests[1], tests[2]], [])).toEqual({
      engagementIds: [4],
      excludeTestTags: ["oci-image:nginx", "oci-image:redis"],
      allTestTags: [],
    });
  });
});

describe("workloadsOfTests", () => {
  it("lists the workloads of the tests once and sorted", () => {
    expect(workloadsOfTests([runtimeTest(2, "a"), runtimeTest(1, "b"), runtimeTest(2, "c")])).toEqual([
      "deployment/app-1",
      "deployment/app-2",
    ]);
  });
});

describe("loadNamespaceRuntimes", () => {
  const dev: EnvironmentTarget = { environment: "demo/dev", cluster: "in-cluster", namespace: "krci-demo-dev" };
  const qa: EnvironmentTarget = { environment: "demo/qa", cluster: "in-cluster", namespace: "krci-demo-qa" };
  const prod: EnvironmentTarget = { environment: "demo/prod", cluster: "eks-sandbox", namespace: "krci-demo-prod" };

  function namespaceTests(tests: DefectDojoTest[]): DefectDojoTestsResult {
    return { tests, engagements: new Map(tests.length > 0 ? [[4, engagementOf(4)]] : []) };
  }

  it("reads each namespace with the tenant tags and keeps the ones that hold tests", async () => {
    const dd = createTestClient();
    const read = vi
      .spyOn(dd, "listNamespaceTests")
      .mockImplementation(async ({ namespace }) =>
        namespaceTests(namespace === "krci-demo-dev" ? [runtimeTest(1, "nginx")] : [])
      );

    const loaded = await loadNamespaceRuntimes(dd, [dev, qa, prod], ["k8s-ns-label.tenant:krci"]);

    expect(loaded.map(({ target }) => target.environment)).toEqual(["demo/dev"]);
    expect(loaded[0].tests).toHaveLength(1);
    expect(read).toHaveBeenCalledTimes(3);
    expect(read).toHaveBeenCalledWith(dev, ["k8s-ns-label.tenant:krci"]);
    expect(read).toHaveBeenCalledWith(prod, ["k8s-ns-label.tenant:krci"]);
  });

  it("reads nothing for no target", async () => {
    const dd = createTestClient();
    const read = vi.spyOn(dd, "listNamespaceTests");

    expect(await loadNamespaceRuntimes(dd, [], [])).toEqual([]);
    expect(read).not.toHaveBeenCalled();
  });

  it("keeps at most four reads in flight", async () => {
    const dd = createTestClient();
    let inFlight = 0;
    let peak = 0;
    vi.spyOn(dd, "listNamespaceTests").mockImplementation(async () => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 1));
      inFlight -= 1;
      return namespaceTests([]);
    });
    const targets = Array.from({ length: 10 }, (_, i): EnvironmentTarget => ({ ...dev, namespace: `ns-${i}` }));

    await loadNamespaceRuntimes(dd, targets, []);

    expect(peak).toBe(4);
  });
});

describe("namespaceLink", () => {
  function namespace(engagementIds: number[]): NamespaceRuntime {
    return {
      target: { environment: "demo/dev", cluster: "in-cluster", namespace: "krci-demo-dev" },
      tests: [],
      engagements: new Map(engagementIds.map((id) => [id, engagementOf(id)])),
    };
  }

  it("links to the engagement when the namespace has one", () => {
    expect(namespaceLink(createTestClient(), namespace([4]))).toBe(`${WEB_URL}/engagement/4`);
  });

  it("links to the product when the tests are spread over several engagements", () => {
    expect(namespaceLink(createTestClient(), namespace([4, 5]))).toBe(`${WEB_URL}/product/3`);
  });
});
