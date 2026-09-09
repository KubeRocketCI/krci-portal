import { createMockedContext } from "../../../../../__mocks__/context.js";
import { createCaller } from "../../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { K8sClient } from "../../../../../clients/k8s/index.js";
import { K8sApiError } from "@my-project/shared";

vi.mock("../../../../../clients/k8s/index.js", () => ({
  K8sClient: vi.fn(),
}));

const tenantInput = { clusterName: "test-cluster", group: "capsule.clastix.io", version: "v1beta2" };

describe("k8sDiscoveryDocumentProcedure", () => {
  let mockContext: ReturnType<typeof createMockedContext>;
  let mockFetchDiscoveryDocument: Mock;

  beforeEach(() => {
    mockContext = createMockedContext();
    mockFetchDiscoveryDocument = vi.fn();

    (K8sClient as unknown as Mock).mockImplementation(function () {
      return { fetchDiscoveryDocument: mockFetchDiscoveryDocument };
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns the served plurals for a group/version the cluster serves", async () => {
    mockFetchDiscoveryDocument.mockResolvedValue({
      status: "served",
      resources: [
        { name: "tenants", namespaced: false, kind: "Tenant" },
        { name: "capsuleconfigurations", namespaced: false, kind: "CapsuleConfiguration" },
      ],
    });

    const result = await createCaller(mockContext).k8s.discoveryDocument(tenantInput);

    expect(mockFetchDiscoveryDocument).toHaveBeenCalledWith("capsule.clastix.io", "v1beta2");
    expect(result).toEqual({ status: "served", plurals: ["tenants", "capsuleconfigurations"] });
  });

  it("reports an absent group/version as not served instead of throwing", async () => {
    mockFetchDiscoveryDocument.mockResolvedValue({ status: "absent" });

    const result = await createCaller(mockContext).k8s.discoveryDocument(tenantInput);

    expect(result).toEqual({ status: "not-served", plurals: [] });
  });

  it("accepts the core group", async () => {
    mockFetchDiscoveryDocument.mockResolvedValue({ status: "served", resources: [] });

    await createCaller(mockContext).k8s.discoveryDocument({ clusterName: "test-cluster", group: "", version: "v1" });

    expect(mockFetchDiscoveryDocument).toHaveBeenCalledWith("", "v1");
  });

  it("propagates a denied discovery as FORBIDDEN so the client fails open", async () => {
    mockFetchDiscoveryDocument.mockRejectedValue(new K8sApiError(403, "Forbidden", ""));

    await expect(createCaller(mockContext).k8s.discoveryDocument(tenantInput)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("propagates a malformed document as an internal error", async () => {
    mockFetchDiscoveryDocument.mockRejectedValue(
      new Error('Malformed discovery document: "resources" is not an array')
    );

    await expect(createCaller(mockContext).k8s.discoveryDocument(tenantInput)).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
  });

  it.each(["v1", "v1beta2", "v1alpha1", "v2"])("accepts the version %s", async (version) => {
    mockFetchDiscoveryDocument.mockResolvedValue({ status: "absent" });

    await expect(createCaller(mockContext).k8s.discoveryDocument({ ...tenantInput, version })).resolves.toBeDefined();
  });

  it.each([
    ["an uppercase group", { group: "Capsule.Clastix.io" }],
    ["a group with a path", { group: "capsule.clastix.io/v1beta2" }],
    ["a version without the v prefix", { version: "1" }],
    ["a version with a path", { version: "v1/tenants" }],
  ])("rejects %s before reaching the cluster", async (_label, override) => {
    await expect(
      createCaller(mockContext).k8s.discoveryDocument({ ...tenantInput, ...override })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(mockFetchDiscoveryDocument).not.toHaveBeenCalled();
  });
});
