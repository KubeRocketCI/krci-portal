import { createMockedContext } from "../../../../../__mocks__/context.js";
import { createCaller } from "../../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { K8sClient } from "../../../../../clients/k8s/index.js";

vi.mock("../../../../../clients/k8s/index.js", () => ({
  K8sClient: vi.fn(),
}));

describe("k8sScaleWorkload", () => {
  let mockContext: ReturnType<typeof createMockedContext>;
  let mockK8s: { KubeConfig: {}; patchResource: Mock };

  beforeEach(() => {
    mockContext = createMockedContext();
    mockK8s = { KubeConfig: {}, patchResource: vi.fn() };
    (K8sClient as unknown as Mock).mockImplementation(() => mockK8s);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const config = {
    group: "apps",
    version: "v1",
    apiVersion: "apps/v1",
    kind: "Deployment",
    singularName: "deployment",
    pluralName: "deployments",
  } as const;

  it("calls patchResource with /scale subresource and merge patch", async () => {
    mockK8s.patchResource.mockResolvedValueOnce({ spec: { replicas: 5 } });
    const caller = createCaller(mockContext);

    await caller.k8s.scaleWorkload({
      namespace: "ns",
      name: "foo",
      resourceConfig: config,
      replicas: 5,
    });

    // K8s /scale subresource does not support strategic-merge-patch; use merge-patch.
    expect(mockK8s.patchResource).toHaveBeenCalledWith(
      config,
      "foo",
      "ns",
      { spec: { replicas: 5 } },
      "merge",
      "scale"
    );
  });

  it("rejects negative replicas", async () => {
    const caller = createCaller(mockContext);
    await expect(
      caller.k8s.scaleWorkload({
        namespace: "ns",
        name: "foo",
        resourceConfig: config,
        replicas: -1,
      })
    ).rejects.toThrow(/greater than or equal to 0|too_small/i);
  });

  it("rejects fractional replicas (e.g. 3.5)", async () => {
    const caller = createCaller(mockContext);
    await expect(
      caller.k8s.scaleWorkload({
        namespace: "ns",
        name: "foo",
        resourceConfig: config,
        replicas: 3.5,
      })
    ).rejects.toThrow(/integer|invalid_type/i);
    expect(mockK8s.patchResource).not.toHaveBeenCalled();
  });

  it("rejects replicas above the upper bound (10001)", async () => {
    const caller = createCaller(mockContext);
    await expect(
      caller.k8s.scaleWorkload({
        namespace: "ns",
        name: "foo",
        resourceConfig: config,
        replicas: 10001,
      })
    ).rejects.toThrow(/less than or equal to 10000|too_big/i);
  });

  it("accepts replicas = 0 (suspend) and forwards to patchResource", async () => {
    mockK8s.patchResource.mockResolvedValueOnce({ spec: { replicas: 0 } });
    const caller = createCaller(mockContext);

    await caller.k8s.scaleWorkload({
      namespace: "ns",
      name: "foo",
      resourceConfig: config,
      replicas: 0,
    });

    expect(mockK8s.patchResource).toHaveBeenCalledWith(
      config,
      "foo",
      "ns",
      { spec: { replicas: 0 } },
      "merge",
      "scale"
    );
  });

  it("accepts replicas = 10000 (upper bound) and forwards to patchResource", async () => {
    mockK8s.patchResource.mockResolvedValueOnce({ spec: { replicas: 10000 } });
    const caller = createCaller(mockContext);

    await caller.k8s.scaleWorkload({
      namespace: "ns",
      name: "foo",
      resourceConfig: config,
      replicas: 10000,
    });

    expect(mockK8s.patchResource).toHaveBeenCalledWith(
      config,
      "foo",
      "ns",
      { spec: { replicas: 10000 } },
      "merge",
      "scale"
    );
  });

  it("rejects non-scalable kinds (e.g. DaemonSet)", async () => {
    const caller = createCaller(mockContext);
    await expect(
      caller.k8s.scaleWorkload({
        namespace: "ns",
        name: "foo",
        // @ts-expect-error intentionally invalid kind to assert runtime rejection
        resourceConfig: { ...config, kind: "DaemonSet" },
        replicas: 3,
      })
    ).rejects.toThrow(/kind must be one of/i);
    expect(mockK8s.patchResource).not.toHaveBeenCalled();
  });

  it("throws when KubeConfig is not initialized", async () => {
    mockK8s.KubeConfig = null as unknown as {};
    const caller = createCaller(mockContext);
    await expect(
      caller.k8s.scaleWorkload({
        namespace: "ns",
        name: "foo",
        resourceConfig: config,
        replicas: 3,
      })
    ).rejects.toThrow(/initialized/i);
  });

  it("throws BAD_REQUEST when group does not match canonical config for the kind", async () => {
    const caller = createCaller(mockContext);
    await expect(
      caller.k8s.scaleWorkload({
        namespace: "ns",
        name: "foo",
        // Deployment with a wrong group — should be "apps"
        resourceConfig: {
          ...config,
          group: "rbac.authorization.k8s.io",
          apiVersion: "rbac.authorization.k8s.io/v1",
          pluralName: "clusterroles",
        },
        replicas: 3,
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mockK8s.patchResource).not.toHaveBeenCalled();
  });

  it("throws BAD_REQUEST when pluralName does not match canonical config for the kind", async () => {
    const caller = createCaller(mockContext);
    await expect(
      caller.k8s.scaleWorkload({
        namespace: "ns",
        name: "foo",
        // Deployment kind but pluralName pointing to a different resource
        resourceConfig: { ...config, pluralName: "statefulsets" },
        replicas: 3,
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mockK8s.patchResource).not.toHaveBeenCalled();
  });

  it("accepts a valid ReplicationController config (core group)", async () => {
    mockK8s.patchResource.mockResolvedValueOnce({ spec: { replicas: 2 } });
    const caller = createCaller(mockContext);

    await caller.k8s.scaleWorkload({
      namespace: "ns",
      name: "foo",
      resourceConfig: {
        group: "",
        version: "v1",
        apiVersion: "v1",
        kind: "ReplicationController",
        singularName: "replicationcontroller",
        pluralName: "replicationcontrollers",
      },
      replicas: 2,
    });

    expect(mockK8s.patchResource).toHaveBeenCalledTimes(1);
  });
});
