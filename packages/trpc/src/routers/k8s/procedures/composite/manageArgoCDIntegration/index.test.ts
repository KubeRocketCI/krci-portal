import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import {
  createArgoCDIntegrationSecretDraft,
  editArgoCDIntegrationSecret,
  editQuickLinkURL,
  k8sQuickLinkConfig,
  k8sSecretConfig,
} from "@my-project/shared";
import { createMockedContext } from "../../../../../__mocks__/context.js";
import { K8sClient } from "../../../../../clients/k8s/index.js";
import { createCaller } from "../../../../../routers/index.js";
import { EDITED_NAME, integrationFixture } from "../__fixtures__/integration.js";

vi.mock("../../../../../clients/k8s/index.js", () => ({ K8sClient: vi.fn() }));

vi.mock("@my-project/shared", async (importOriginal) => {
  const { mockIntegrationShared } = await import("../__fixtures__/integration.js");
  return mockIntegrationShared(await importOriginal<typeof import("@my-project/shared")>(), [
    "createArgoCDIntegrationSecretDraft",
    "editArgoCDIntegrationSecret",
    "editQuickLinkURL",
  ]);
});

const { namespace, quickLink, secret, written, mockK8sClient } = integrationFixture();

const baseInput = {
  clusterName: "test-cluster",
  namespace,
  mode: "edit" as const,
  dirtyFields: { quickLink: false, secret: false },
  secret: { token: "test-token", url: "https://argocd.example.com" },
};

describe("k8sManageArgoCDIntegrationProcedure", () => {
  let mockContext: ReturnType<typeof createMockedContext>;
  let k8s: ReturnType<typeof mockK8sClient>;

  beforeEach(() => {
    mockContext = createMockedContext();
    k8s = mockK8sClient();
    (K8sClient as unknown as Mock).mockImplementation(function () {
      return k8s;
    });
  });

  afterEach(() => vi.clearAllMocks());

  it("creates the ArgoCD secret from token and url", async () => {
    k8s.createResource.mockResolvedValueOnce(written);

    const result = await createCaller(mockContext).k8s.manageArgoCDIntegration({
      ...baseInput,
      mode: "create",
      dirtyFields: { quickLink: false, secret: true },
    });

    expect(createArgoCDIntegrationSecretDraft).toHaveBeenCalledWith({
      token: "test-token",
      url: "https://argocd.example.com",
    });
    expect(k8s.createResource).toHaveBeenCalledWith(k8sSecretConfig, namespace, expect.anything());
    expect(result.data.secret).toEqual(written);
  });

  it("patches the live ArgoCD secret with token and url", async () => {
    k8s.replaceResource.mockResolvedValueOnce(written);

    await createCaller(mockContext).k8s.manageArgoCDIntegration({
      ...baseInput,
      dirtyFields: { quickLink: false, secret: true },
      secret: { ...baseInput.secret, currentResource: secret },
    });

    expect(editArgoCDIntegrationSecret).toHaveBeenCalledWith(secret, {
      token: "test-token",
      url: "https://argocd.example.com",
    });
    expect(k8s.replaceResource).toHaveBeenCalledWith(k8sSecretConfig, EDITED_NAME, namespace, expect.anything());
  });

  it("rewrites the QuickLink url", async () => {
    k8s.replaceResource.mockResolvedValueOnce(written);

    await createCaller(mockContext).k8s.manageArgoCDIntegration({
      ...baseInput,
      dirtyFields: { quickLink: true, secret: false },
      quickLink: { name: "argocd", externalUrl: "https://argocd-updated.example.com", currentResource: quickLink },
    });

    expect(editQuickLinkURL).toHaveBeenCalledWith(quickLink, { url: "https://argocd-updated.example.com" });
    expect(k8s.replaceResource).toHaveBeenCalledWith(k8sQuickLinkConfig, EDITED_NAME, namespace, expect.anything());
  });
});
