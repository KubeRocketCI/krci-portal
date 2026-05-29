import { createMockedContext } from "../../../../../__mocks__/context.js";
import { createCaller } from "../../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { K8sClient } from "../../../../../clients/k8s/index.js";

vi.mock("../../../../../clients/k8s/index.js", () => ({ K8sClient: vi.fn() }));

describe("k8sRestartWorkload", () => {
  let mockContext: ReturnType<typeof createMockedContext>;
  let mockK8s: { KubeConfig: {}; patchResource: Mock };

  beforeEach(() => {
    mockContext = createMockedContext();
    mockK8s = { KubeConfig: {}, patchResource: vi.fn() };
    (K8sClient as unknown as Mock).mockImplementation(() => mockK8s);
  });

  afterEach(() => vi.clearAllMocks());

  const config = {
    group: "apps",
    version: "v1",
    apiVersion: "apps/v1",
    kind: "Deployment",
    singularName: "deployment",
    pluralName: "deployments",
  } as const;

  it("patches the parent resource (no subresource) with the restartedAt annotation", async () => {
    mockK8s.patchResource.mockResolvedValueOnce({});
    const caller = createCaller(mockContext);

    await caller.k8s.restartWorkload({
      namespace: "ns",
      name: "foo",
      resourceConfig: config,
    });

    expect(mockK8s.patchResource).toHaveBeenCalledTimes(1);
    const [cfgArg, nameArg, nsArg, bodyArg, patchTypeArg, subArg] = mockK8s.patchResource.mock.calls[0];
    expect(cfgArg).toEqual(config);
    expect(nameArg).toBe("foo");
    expect(nsArg).toBe("ns");
    expect(patchTypeArg).toBe("strategic");
    expect(subArg).toBeUndefined();

    const annotation = bodyArg.spec.template.metadata.annotations["kubectl.kubernetes.io/restartedAt"];
    expect(typeof annotation).toBe("string");
    expect(() => new Date(annotation).toISOString()).not.toThrow();
  });

  it("rejects non-restartable kinds (e.g. Job)", async () => {
    const caller = createCaller(mockContext);
    await expect(
      caller.k8s.restartWorkload({
        namespace: "ns",
        name: "foo",
        // @ts-expect-error intentionally invalid kind to assert runtime rejection
        resourceConfig: { ...config, kind: "Job" },
      })
    ).rejects.toThrow(/kind must be one of/i);
    expect(mockK8s.patchResource).not.toHaveBeenCalled();
  });

  it("propagates K8s API errors via handleK8sError", async () => {
    mockK8s.patchResource.mockRejectedValueOnce(new Error("kube-apiserver unreachable"));
    const caller = createCaller(mockContext);
    await expect(
      caller.k8s.restartWorkload({
        namespace: "ns",
        name: "foo",
        resourceConfig: config,
      })
    ).rejects.toThrow();
  });

  it("throws when KubeConfig is not initialized", async () => {
    mockK8s.KubeConfig = null as unknown as {};
    const caller = createCaller(mockContext);
    await expect(
      caller.k8s.restartWorkload({
        namespace: "ns",
        name: "foo",
        resourceConfig: config,
      })
    ).rejects.toThrow(/initialized/i);
  });

  it("throws BAD_REQUEST when group does not match canonical config for the kind", async () => {
    const caller = createCaller(mockContext);
    await expect(
      caller.k8s.restartWorkload({
        namespace: "ns",
        name: "foo",
        // Deployment with a wrong group — should be "apps"
        resourceConfig: {
          ...config,
          group: "rbac.authorization.k8s.io",
          apiVersion: "rbac.authorization.k8s.io/v1",
          pluralName: "clusterroles",
        },
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mockK8s.patchResource).not.toHaveBeenCalled();
  });

  it("throws BAD_REQUEST when pluralName does not match canonical config for the kind", async () => {
    const caller = createCaller(mockContext);
    await expect(
      caller.k8s.restartWorkload({
        namespace: "ns",
        name: "foo",
        // Deployment kind but pluralName pointing to a different resource
        resourceConfig: { ...config, pluralName: "daemonsets" },
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mockK8s.patchResource).not.toHaveBeenCalled();
  });
});
