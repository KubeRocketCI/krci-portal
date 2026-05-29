import { createMockedContext } from "../../../../../__mocks__/context.js";
import { createCaller } from "../../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { K8sClient } from "../../../../../clients/k8s/index.js";

vi.mock("../../../../../clients/k8s/index.js", () => ({ K8sClient: vi.fn() }));

describe("k8sRollbackDeployment", () => {
  let mockContext: ReturnType<typeof createMockedContext>;
  let mockK8s: {
    KubeConfig: {};
    getResource: Mock;
    listAllResources: Mock;
    patchResource: Mock;
  };

  beforeEach(() => {
    mockContext = createMockedContext();
    mockK8s = {
      KubeConfig: {},
      getResource: vi.fn(),
      listAllResources: vi.fn(),
      patchResource: vi.fn(),
    };
    (K8sClient as unknown as Mock).mockImplementation(() => mockK8s);
  });

  afterEach(() => vi.clearAllMocks());

  const deployment = {
    metadata: { name: "foo", namespace: "ns", uid: "dep-uid" },
    spec: { selector: { matchLabels: { app: "foo" } } },
  };

  const ownedRS = {
    metadata: {
      uid: "rs-uid",
      name: "foo-rs",
      ownerReferences: [{ kind: "Deployment", uid: "dep-uid", controller: true }],
    },
    spec: { template: { spec: { containers: [{ image: "app:1" }] } } },
  };

  it("throws BAD_REQUEST when the target RS is already the current revision", async () => {
    mockK8s.getResource.mockResolvedValueOnce({
      metadata: {
        name: "foo",
        namespace: "ns",
        uid: "dep-uid",
        annotations: { "deployment.kubernetes.io/revision": "5" },
      },
      spec: { selector: { matchLabels: { app: "foo" } } },
    });
    const currentRS = {
      metadata: {
        uid: "rs-current",
        name: "foo-rs-5",
        annotations: { "deployment.kubernetes.io/revision": "5" },
        ownerReferences: [{ kind: "Deployment", uid: "dep-uid", controller: true }],
      },
      spec: { template: { spec: { containers: [{ image: "app:5" }] } } },
    };
    mockK8s.listAllResources.mockResolvedValueOnce({ items: [currentRS] });

    const caller = createCaller(mockContext);
    await expect(
      caller.k8s.rollbackDeployment({
        namespace: "ns",
        name: "foo",
        replicaSetUid: "rs-current",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mockK8s.patchResource).not.toHaveBeenCalled();
  });

  it("patches the deployment with the target RS's spec.template", async () => {
    mockK8s.getResource.mockResolvedValueOnce(deployment);
    mockK8s.listAllResources.mockResolvedValueOnce({ items: [ownedRS] });
    mockK8s.patchResource.mockResolvedValueOnce({});

    const caller = createCaller(mockContext);
    await caller.k8s.rollbackDeployment({
      namespace: "ns",
      name: "foo",
      replicaSetUid: "rs-uid",
    });

    expect(mockK8s.patchResource).toHaveBeenCalledTimes(1);
    const [, , , body, patchType] = mockK8s.patchResource.mock.calls[0];
    expect(body).toEqual({ spec: { template: ownedRS.spec.template } });
    expect(patchType).toBe("strategic");

    // Verify the labelSelector derived from spec.selector.matchLabels was passed.
    expect(mockK8s.listAllResources).toHaveBeenCalledWith(expect.anything(), "ns", "app=foo");
  });

  it("propagates K8s API errors from patchResource via handleK8sError", async () => {
    mockK8s.getResource.mockResolvedValueOnce(deployment);
    mockK8s.listAllResources.mockResolvedValueOnce({ items: [ownedRS] });
    mockK8s.patchResource.mockRejectedValueOnce(new Error("upstream"));

    const caller = createCaller(mockContext);
    await expect(
      caller.k8s.rollbackDeployment({
        namespace: "ns",
        name: "foo",
        replicaSetUid: "rs-uid",
      })
    ).rejects.toThrow();
  });

  it("falls back to no labelSelector when the Deployment has no spec.selector", async () => {
    const deploymentNoSelector = { metadata: { name: "foo", namespace: "ns", uid: "dep-uid" } };
    mockK8s.getResource.mockResolvedValueOnce(deploymentNoSelector);
    mockK8s.listAllResources.mockResolvedValueOnce({ items: [ownedRS] });
    mockK8s.patchResource.mockResolvedValueOnce({});

    const caller = createCaller(mockContext);
    await caller.k8s.rollbackDeployment({
      namespace: "ns",
      name: "foo",
      replicaSetUid: "rs-uid",
    });

    expect(mockK8s.listAllResources).toHaveBeenCalledWith(expect.anything(), "ns", undefined);
  });

  it("throws NOT_FOUND when the target RS uid is missing in the namespace", async () => {
    mockK8s.getResource.mockResolvedValueOnce(deployment);
    mockK8s.listAllResources.mockResolvedValueOnce({ items: [] });

    const caller = createCaller(mockContext);
    await expect(
      caller.k8s.rollbackDeployment({
        namespace: "ns",
        name: "foo",
        replicaSetUid: "missing",
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("throws NOT_FOUND when the target RS is owned by a different deployment", async () => {
    mockK8s.getResource.mockResolvedValueOnce(deployment);
    const foreign = {
      metadata: {
        uid: "rs-uid",
        name: "foo-rs",
        ownerReferences: [{ kind: "Deployment", uid: "OTHER", controller: true }],
      },
      spec: { template: { spec: { containers: [] } } },
    };
    mockK8s.listAllResources.mockResolvedValueOnce({ items: [foreign] });

    const caller = createCaller(mockContext);
    await expect(
      caller.k8s.rollbackDeployment({
        namespace: "ns",
        name: "foo",
        replicaSetUid: "rs-uid",
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("throws NOT_FOUND when the Deployment has no uid in metadata", async () => {
    mockK8s.getResource.mockResolvedValueOnce({ metadata: { name: "foo", namespace: "ns" } });

    const caller = createCaller(mockContext);
    await expect(
      caller.k8s.rollbackDeployment({
        namespace: "ns",
        name: "foo",
        replicaSetUid: "rs-uid",
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND", message: expect.stringMatching(/missing UID/i) });
    expect(mockK8s.listAllResources).not.toHaveBeenCalled();
  });

  it("throws NOT_FOUND when the target RS has no spec.template", async () => {
    mockK8s.getResource.mockResolvedValueOnce(deployment);
    const rsWithoutTemplate = {
      metadata: {
        uid: "rs-uid",
        name: "foo-rs",
        ownerReferences: [{ kind: "Deployment", uid: "dep-uid", controller: true }],
      },
      spec: {},
    };
    mockK8s.listAllResources.mockResolvedValueOnce({ items: [rsWithoutTemplate] });

    const caller = createCaller(mockContext);
    await expect(
      caller.k8s.rollbackDeployment({
        namespace: "ns",
        name: "foo",
        replicaSetUid: "rs-uid",
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(mockK8s.patchResource).not.toHaveBeenCalled();
  });

  it("throws NOT_FOUND when the matching RS is a non-controlling owner", async () => {
    mockK8s.getResource.mockResolvedValueOnce(deployment);
    const nonControlling = {
      metadata: {
        uid: "rs-uid",
        name: "foo-rs",
        ownerReferences: [{ kind: "Deployment", uid: "dep-uid", controller: false }],
      },
      spec: { template: { spec: { containers: [] } } },
    };
    mockK8s.listAllResources.mockResolvedValueOnce({ items: [nonControlling] });

    const caller = createCaller(mockContext);
    await expect(
      caller.k8s.rollbackDeployment({
        namespace: "ns",
        name: "foo",
        replicaSetUid: "rs-uid",
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("propagates K8s API errors via handleK8sError", async () => {
    mockK8s.getResource.mockResolvedValueOnce(deployment);
    mockK8s.listAllResources.mockRejectedValueOnce(new Error("kube-apiserver unreachable"));

    const caller = createCaller(mockContext);
    await expect(
      caller.k8s.rollbackDeployment({
        namespace: "ns",
        name: "foo",
        replicaSetUid: "rs-uid",
      })
    ).rejects.toThrow();
    expect(mockK8s.patchResource).not.toHaveBeenCalled();
  });

  it("blocks rollback when Deployment annotation is '010' and RS annotation is '10' (numeric normalisation)", async () => {
    // Deployment stores the revision as '010' (leading zero); RS stores it as '10'.
    // String equality would consider them different and allow the rollback — numeric
    // comparison must normalise both to 10 and block it.
    mockK8s.getResource.mockResolvedValueOnce({
      metadata: {
        name: "foo",
        namespace: "ns",
        uid: "dep-uid",
        annotations: { "deployment.kubernetes.io/revision": "010" },
      },
      spec: { selector: { matchLabels: { app: "foo" } } },
    });
    const currentRS = {
      metadata: {
        uid: "rs-current",
        name: "foo-rs-10",
        annotations: { "deployment.kubernetes.io/revision": "10" },
        ownerReferences: [{ kind: "Deployment", uid: "dep-uid", controller: true }],
      },
      spec: { template: { spec: { containers: [{ image: "app:10" }] } } },
    };
    mockK8s.listAllResources.mockResolvedValueOnce({ items: [currentRS] });

    const caller = createCaller(mockContext);
    await expect(
      caller.k8s.rollbackDeployment({ namespace: "ns", name: "foo", replicaSetUid: "rs-current" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mockK8s.patchResource).not.toHaveBeenCalled();
  });

  it("blocks rollback when RS annotation is '010' and Deployment annotation is '10' (numeric normalisation, reversed)", async () => {
    // The reverse: RS has the leading zero. Both still represent revision 10.
    mockK8s.getResource.mockResolvedValueOnce({
      metadata: {
        name: "foo",
        namespace: "ns",
        uid: "dep-uid",
        annotations: { "deployment.kubernetes.io/revision": "10" },
      },
      spec: { selector: { matchLabels: { app: "foo" } } },
    });
    const currentRS = {
      metadata: {
        uid: "rs-current",
        name: "foo-rs-10",
        annotations: { "deployment.kubernetes.io/revision": "010" },
        ownerReferences: [{ kind: "Deployment", uid: "dep-uid", controller: true }],
      },
      spec: { template: { spec: { containers: [{ image: "app:10" }] } } },
    };
    mockK8s.listAllResources.mockResolvedValueOnce({ items: [currentRS] });

    const caller = createCaller(mockContext);
    await expect(
      caller.k8s.rollbackDeployment({ namespace: "ns", name: "foo", replicaSetUid: "rs-current" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mockK8s.patchResource).not.toHaveBeenCalled();
  });

  it("throws BAD_REQUEST when currentRevision is undefined and target is the highest-revision RS (fallback B)", async () => {
    // Deployment has no revision annotation — the guard should fall back to highest-revision RS.
    mockK8s.getResource.mockResolvedValueOnce({
      metadata: { name: "foo", namespace: "ns", uid: "dep-uid" },
      spec: { selector: { matchLabels: { app: "foo" } } },
    });
    const rs3 = {
      metadata: {
        uid: "rs-3",
        name: "foo-rs-3",
        annotations: { "deployment.kubernetes.io/revision": "3" },
        ownerReferences: [{ kind: "Deployment", uid: "dep-uid", controller: true }],
      },
      spec: { template: { spec: { containers: [{ image: "app:3" }] } } },
    };
    const rs2 = {
      metadata: {
        uid: "rs-2",
        name: "foo-rs-2",
        annotations: { "deployment.kubernetes.io/revision": "2" },
        ownerReferences: [{ kind: "Deployment", uid: "dep-uid", controller: true }],
      },
      spec: { template: { spec: { containers: [{ image: "app:2" }] } } },
    };
    mockK8s.listAllResources.mockResolvedValueOnce({ items: [rs3, rs2] });

    const caller = createCaller(mockContext);
    // rs-3 is the highest revision RS — rolling back to it is a no-op
    await expect(
      caller.k8s.rollbackDeployment({ namespace: "ns", name: "foo", replicaSetUid: "rs-3" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mockK8s.patchResource).not.toHaveBeenCalled();
  });

  it("allows rollback when currentRevision is undefined and target is NOT the highest-revision RS (fallback B)", async () => {
    mockK8s.getResource.mockResolvedValueOnce({
      metadata: { name: "foo", namespace: "ns", uid: "dep-uid" },
      spec: { selector: { matchLabels: { app: "foo" } } },
    });
    const rs3 = {
      metadata: {
        uid: "rs-3",
        name: "foo-rs-3",
        annotations: { "deployment.kubernetes.io/revision": "3" },
        ownerReferences: [{ kind: "Deployment", uid: "dep-uid", controller: true }],
      },
      spec: { template: { spec: { containers: [{ image: "app:3" }] } } },
    };
    const rs2 = {
      metadata: {
        uid: "rs-2",
        name: "foo-rs-2",
        annotations: { "deployment.kubernetes.io/revision": "2" },
        ownerReferences: [{ kind: "Deployment", uid: "dep-uid", controller: true }],
      },
      spec: { template: { spec: { containers: [{ image: "app:2" }] } } },
    };
    mockK8s.listAllResources.mockResolvedValueOnce({ items: [rs3, rs2] });
    mockK8s.patchResource.mockResolvedValueOnce({});

    const caller = createCaller(mockContext);
    // rs-2 is an older revision — rolling back to it should be allowed
    await caller.k8s.rollbackDeployment({ namespace: "ns", name: "foo", replicaSetUid: "rs-2" });
    expect(mockK8s.patchResource).toHaveBeenCalledTimes(1);
  });
});
