import { createMockedContext } from "../../../../../__mocks__/context.js";
import { createCaller } from "../../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { K8sClient } from "../../../../../clients/k8s/index.js";

vi.mock("../../../../../clients/k8s/index.js", () => ({ K8sClient: vi.fn() }));

const makeDeployment = (uid = "dep-uid", revision = "5") => ({
  metadata: { name: "foo", namespace: "ns", uid, annotations: { "deployment.kubernetes.io/revision": revision } },
  spec: { selector: { matchLabels: { app: "foo" } } },
});

const makeRS = (revision: string, ownerUid = "dep-uid", suffix = "") => ({
  metadata: {
    name: `foo-${revision}${suffix}`,
    uid: `rs-${revision}${suffix}`,
    creationTimestamp: `2026-05-${10 + Number(revision || 0)}T00:00:00Z`,
    annotations: { "deployment.kubernetes.io/revision": revision },
    ownerReferences: [{ kind: "Deployment", uid: ownerUid, name: "foo", controller: true }],
  },
  spec: {
    template: {
      spec: {
        containers: [{ image: `app:${revision}` }],
      },
    },
  },
});

describe("k8sListDeploymentRevisions", () => {
  let mockContext: ReturnType<typeof createMockedContext>;
  let mockK8s: { KubeConfig: {}; getResource: Mock; listAllResources: Mock };

  beforeEach(() => {
    mockContext = createMockedContext();
    mockK8s = { KubeConfig: {}, getResource: vi.fn(), listAllResources: vi.fn() };
    (K8sClient as unknown as Mock).mockImplementation(() => mockK8s);
  });

  afterEach(() => vi.clearAllMocks());

  it("filters by ownerReferences.uid, sorts DESC, caps at 10, flags current", async () => {
    mockK8s.getResource.mockResolvedValueOnce(makeDeployment("dep-uid", "5"));
    mockK8s.listAllResources.mockResolvedValueOnce({
      items: [
        makeRS("1"),
        makeRS("2"),
        makeRS("3"),
        makeRS("4"),
        makeRS("5"),
        makeRS("6"),
        makeRS("7"),
        makeRS("8"),
        makeRS("9"),
        makeRS("10"),
        makeRS("11"),
        makeRS("12"),
        makeRS("3", "OTHER", "-foreign"),
      ],
    });

    const caller = createCaller(mockContext);
    const result = await caller.k8s.listDeploymentRevisions({
      namespace: "ns",
      name: "foo",
    });

    expect(result).toHaveLength(10);
    expect(result[0].revision).toBe(12);
    expect(result[9].revision).toBe(3);
    expect(result.find((r) => r.replicaSetName.endsWith("-foreign"))).toBeUndefined();
    const current = result.find((r) => r.isCurrent);
    expect(current?.revision).toBe(5);
  });

  it("returns an empty array when no ReplicaSets are owned by the deployment", async () => {
    mockK8s.getResource.mockResolvedValueOnce(makeDeployment());
    mockK8s.listAllResources.mockResolvedValueOnce({ items: [makeRS("1", "OTHER")] });

    const caller = createCaller(mockContext);
    const result = await caller.k8s.listDeploymentRevisions({
      namespace: "ns",
      name: "foo",
    });

    expect(result).toEqual([]);
  });

  it("excludes ReplicaSets with non-numeric revision annotation", async () => {
    mockK8s.getResource.mockResolvedValueOnce(makeDeployment());
    mockK8s.listAllResources.mockResolvedValueOnce({
      items: [
        makeRS("1"),
        {
          ...makeRS("nope"),
          metadata: { ...makeRS("nope").metadata, annotations: { "deployment.kubernetes.io/revision": "abc" } },
        },
      ],
    });

    const caller = createCaller(mockContext);
    const result = await caller.k8s.listDeploymentRevisions({
      namespace: "ns",
      name: "foo",
    });

    expect(result).toHaveLength(1);
    expect(result[0].revision).toBe(1);
  });

  it("includes container images and replicaSetUid on each row", async () => {
    mockK8s.getResource.mockResolvedValueOnce(makeDeployment());
    mockK8s.listAllResources.mockResolvedValueOnce({ items: [makeRS("1")] });

    const caller = createCaller(mockContext);
    const result = await caller.k8s.listDeploymentRevisions({
      namespace: "ns",
      name: "foo",
    });

    expect(result[0]).toMatchObject({
      revision: 1,
      replicaSetName: "foo-1",
      replicaSetUid: "rs-1",
      images: ["app:1"],
    });
    expect(result[0].creationTimestamp).toBe("2026-05-11T00:00:00Z");
  });

  it("excludes RSes where the Deployment is a non-controlling owner", async () => {
    mockK8s.getResource.mockResolvedValueOnce(makeDeployment());
    const rs = makeRS("1");
    rs.metadata.ownerReferences = [{ kind: "Deployment", uid: "dep-uid", name: "foo", controller: false }];
    mockK8s.listAllResources.mockResolvedValueOnce({ items: [rs] });

    const caller = createCaller(mockContext);
    const result = await caller.k8s.listDeploymentRevisions({
      namespace: "ns",
      name: "foo",
    });

    expect(result).toEqual([]);
  });

  it("filters out empty image strings", async () => {
    mockK8s.getResource.mockResolvedValueOnce(makeDeployment());
    const rs = makeRS("1");
    rs.spec.template.spec.containers = [{ image: "app:1" }, { image: "" }, { image: undefined }] as Array<{
      image: string;
    }>;
    mockK8s.listAllResources.mockResolvedValueOnce({ items: [rs] });

    const caller = createCaller(mockContext);
    const result = await caller.k8s.listDeploymentRevisions({
      namespace: "ns",
      name: "foo",
    });

    expect(result[0].images).toEqual(["app:1"]);
  });

  it("throws NOT_FOUND when the Deployment has no uid in metadata", async () => {
    mockK8s.getResource.mockResolvedValueOnce({
      metadata: { name: "foo", namespace: "ns", annotations: { "deployment.kubernetes.io/revision": "1" } },
    });

    const caller = createCaller(mockContext);
    await expect(
      caller.k8s.listDeploymentRevisions({
        namespace: "ns",
        name: "foo",
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(mockK8s.listAllResources).not.toHaveBeenCalled();
  });

  it("propagates errors from getResource via handleK8sError", async () => {
    mockK8s.getResource.mockRejectedValueOnce(new Error("kube-apiserver unreachable"));

    const caller = createCaller(mockContext);
    await expect(
      caller.k8s.listDeploymentRevisions({
        namespace: "ns",
        name: "foo",
      })
    ).rejects.toThrow();
    expect(mockK8s.listAllResources).not.toHaveBeenCalled();
  });

  it("forwards labelSelector derived from spec.selector.matchLabels to listResource", async () => {
    mockK8s.getResource.mockResolvedValueOnce(makeDeployment());
    mockK8s.listAllResources.mockResolvedValueOnce({ items: [makeRS("1")] });

    const caller = createCaller(mockContext);
    await caller.k8s.listDeploymentRevisions({
      namespace: "ns",
      name: "foo",
    });

    expect(mockK8s.listAllResources).toHaveBeenCalledWith(expect.anything(), "ns", "app=foo");
  });

  it("falls back to no labelSelector when Deployment has no spec.selector", async () => {
    mockK8s.getResource.mockResolvedValueOnce({
      metadata: {
        name: "foo",
        namespace: "ns",
        uid: "dep-uid",
        annotations: { "deployment.kubernetes.io/revision": "1" },
      },
    });
    mockK8s.listAllResources.mockResolvedValueOnce({ items: [makeRS("1")] });

    const caller = createCaller(mockContext);
    await caller.k8s.listDeploymentRevisions({
      namespace: "ns",
      name: "foo",
    });

    expect(mockK8s.listAllResources).toHaveBeenCalledWith(expect.anything(), "ns", undefined);
  });

  it("propagates errors from listResource via handleK8sError", async () => {
    mockK8s.getResource.mockResolvedValueOnce(makeDeployment());
    mockK8s.listAllResources.mockRejectedValueOnce(new Error("rs list failed"));

    const caller = createCaller(mockContext);
    await expect(
      caller.k8s.listDeploymentRevisions({
        namespace: "ns",
        name: "foo",
      })
    ).rejects.toThrow();
  });

  it("correctly identifies isCurrent when Deployment revision annotation has leading zero ('010' vs '10')", async () => {
    // String equality '010' === '10' is false, but numeric equality Number('010') === Number('10') is true.
    mockK8s.getResource.mockResolvedValueOnce({
      metadata: {
        name: "foo",
        namespace: "ns",
        uid: "dep-uid",
        // Non-standard: leading zero in the deployment annotation
        annotations: { "deployment.kubernetes.io/revision": "010" },
      },
      spec: { selector: { matchLabels: { app: "foo" } } },
    });
    const rs10 = {
      metadata: {
        name: "foo-10",
        uid: "rs-10",
        creationTimestamp: "2026-05-20T00:00:00Z",
        annotations: { "deployment.kubernetes.io/revision": "10" },
        ownerReferences: [{ kind: "Deployment", uid: "dep-uid", name: "foo", controller: true }],
      },
      spec: { template: { spec: { containers: [{ image: "app:10" }] } } },
    };
    mockK8s.listAllResources.mockResolvedValueOnce({ items: [rs10] });

    const caller = createCaller(mockContext);
    const result = await caller.k8s.listDeploymentRevisions({ namespace: "ns", name: "foo" });

    expect(result).toHaveLength(1);
    expect(result[0].isCurrent).toBe(true);
  });
});
