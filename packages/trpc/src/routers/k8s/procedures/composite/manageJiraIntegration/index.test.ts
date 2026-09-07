import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import {
  createJiraIntegrationSecretDraft,
  createJiraServerDraft,
  editJiraIntegrationSecret,
  editJiraServer,
  editQuickLinkURL,
  k8sJiraServerConfig,
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
    "createJiraIntegrationSecretDraft",
    "editJiraIntegrationSecret",
    "createJiraServerDraft",
    "editJiraServer",
    "editQuickLinkURL",
  ]);
});

const { namespace, jiraServer, quickLink, secret, written, mockK8sClient } = integrationFixture();

const credentials = { username: "test-user", password: "test-password" };

const baseInput = {
  clusterName: "test-cluster",
  namespace,
  mode: "edit" as const,
  dirtyFields: { jiraServer: false, quickLink: false, secret: false },
  jiraServer: { url: "https://jira.example.com" },
  secret: credentials,
};

describe("k8sManageJiraIntegrationProcedure", () => {
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

  it("creates the secret and the JiraServer in create mode, secret first", async () => {
    k8s.createResource.mockResolvedValue(written);

    const result = await createCaller(mockContext).k8s.manageJiraIntegration({
      ...baseInput,
      mode: "create",
      dirtyFields: { jiraServer: true, quickLink: false, secret: true },
    });

    expect(createJiraIntegrationSecretDraft).toHaveBeenCalledWith(credentials);
    expect(createJiraServerDraft).toHaveBeenCalledWith({ url: "https://jira.example.com" });
    expect(k8s.createResource.mock.calls.map((args) => args[0])).toEqual([k8sSecretConfig, k8sJiraServerConfig]);
    expect(result.data.secret).toEqual(written);
    expect(result.data.jiraServer).toEqual(written);
  });

  it("patches the live secret and JiraServer in edit mode", async () => {
    k8s.replaceResource.mockResolvedValue(written);

    await createCaller(mockContext).k8s.manageJiraIntegration({
      ...baseInput,
      dirtyFields: { jiraServer: true, quickLink: false, secret: true },
      jiraServer: { url: "https://jira-new.example.com", currentResource: jiraServer },
      secret: { ...credentials, currentResource: secret },
    });

    expect(editJiraIntegrationSecret).toHaveBeenCalledWith(secret, credentials);
    expect(editJiraServer).toHaveBeenCalledWith(jiraServer, { url: "https://jira-new.example.com" });
    expect(k8s.replaceResource.mock.calls.map((args) => args[0])).toEqual([k8sSecretConfig, k8sJiraServerConfig]);
  });

  it("rewrites the QuickLink url", async () => {
    k8s.replaceResource.mockResolvedValueOnce(written);

    await createCaller(mockContext).k8s.manageJiraIntegration({
      ...baseInput,
      dirtyFields: { jiraServer: false, quickLink: true, secret: false },
      quickLink: { name: "jira", externalUrl: "https://jira-updated.example.com", currentResource: quickLink },
    });

    expect(editQuickLinkURL).toHaveBeenCalledWith(quickLink, { url: "https://jira-updated.example.com" });
    expect(k8s.replaceResource).toHaveBeenCalledWith(k8sQuickLinkConfig, EDITED_NAME, namespace, expect.anything());
  });
});
