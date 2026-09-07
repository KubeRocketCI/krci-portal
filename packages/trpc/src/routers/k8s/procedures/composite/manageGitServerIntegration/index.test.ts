import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import {
  createGitServerDraft,
  createGitServerSecretDraft,
  editGitServer,
  editGitServerSecret,
  gitProvider,
  k8sGitServerConfig,
  k8sSecretConfig,
} from "@my-project/shared";
import { createMockedContext } from "../../../../../__mocks__/context.js";
import { K8sClient } from "../../../../../clients/k8s/index.js";
import { createCaller } from "../../../../../routers/index.js";
import { integrationFixture } from "../__fixtures__/integration.js";

vi.mock("../../../../../clients/k8s/index.js", () => ({ K8sClient: vi.fn() }));

vi.mock("@my-project/shared", async (importOriginal) => {
  const { mockIntegrationShared } = await import("../__fixtures__/integration.js");
  return mockIntegrationShared(await importOriginal<typeof import("@my-project/shared")>(), [
    "createGitServerSecretDraft",
    "editGitServerSecret",
    "createGitServerDraft",
    "editGitServer",
  ]);
});

const { namespace, gitServer, secret, written, mockK8sClient } = integrationFixture();

const gitServerSpec = {
  gitHost: "github.com",
  gitProvider: gitProvider.github,
  gitUser: "git",
  nameSshKeySecret: "ci-github",
  sshPort: 22,
  httpsPort: 443,
  skipWebhookSSLVerification: false,
  tektonDisabled: undefined,
  webhookUrl: undefined,
};

const baseInput = {
  clusterName: "test-cluster",
  namespace,
  mode: "edit" as const,
  dirtyFields: { gitServer: false, secret: false },
  gitServer: { name: "github", ...gitServerSpec },
  secret: {
    gitProvider: gitProvider.github,
    sshPrivateKey: "private-key",
    token: "test-token",
  },
};

describe("k8sManageGitServerIntegrationProcedure", () => {
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

  it("creates the secret and the GitServer in create mode, secret first", async () => {
    k8s.createResource.mockResolvedValue(written);

    const result = await createCaller(mockContext).k8s.manageGitServerIntegration({
      ...baseInput,
      mode: "create",
      dirtyFields: { gitServer: true, secret: true },
    });

    expect(createGitServerSecretDraft).toHaveBeenCalledWith({
      gitProvider: gitProvider.github,
      secretName: "ci-github",
      sshPrivateKey: "private-key",
      token: "test-token",
    });
    expect(createGitServerDraft).toHaveBeenCalledWith({ name: "github", ...gitServerSpec });
    expect(k8s.createResource.mock.calls.map((args) => args[0])).toEqual([k8sSecretConfig, k8sGitServerConfig]);
    expect(result.data.secret).toEqual(written);
    expect(result.data.gitServer).toEqual(written);
  });

  it("sends ssh keys instead of a token for Gerrit", async () => {
    k8s.createResource.mockResolvedValue(written);

    await createCaller(mockContext).k8s.manageGitServerIntegration({
      ...baseInput,
      mode: "create",
      dirtyFields: { gitServer: false, secret: true },
      gitServer: { ...baseInput.gitServer, gitProvider: gitProvider.gerrit, nameSshKeySecret: "ci-gerrit" },
      secret: {
        gitProvider: gitProvider.gerrit,
        sshPrivateKey: "private-key",
        sshPublicKey: "public-key",
      },
    });

    expect(createGitServerSecretDraft).toHaveBeenCalledWith({
      gitProvider: gitProvider.gerrit,
      secretName: "ci-gerrit",
      sshPrivateKey: "private-key",
      sshPublicKey: "public-key",
    });
  });

  it("creates the secret in edit mode when the GitServer has none yet", async () => {
    k8s.createResource.mockResolvedValueOnce(written);

    await createCaller(mockContext).k8s.manageGitServerIntegration({
      ...baseInput,
      dirtyFields: { gitServer: false, secret: true },
    });

    expect(k8s.createResource).toHaveBeenCalledWith(k8sSecretConfig, namespace, expect.anything());
    expect(k8s.replaceResource).not.toHaveBeenCalled();
  });

  it("patches the live secret and GitServer in edit mode", async () => {
    k8s.replaceResource.mockResolvedValue(written);

    await createCaller(mockContext).k8s.manageGitServerIntegration({
      ...baseInput,
      dirtyFields: { gitServer: true, secret: true },
      gitServer: { ...baseInput.gitServer, currentResource: gitServer },
      secret: { ...baseInput.secret, currentResource: secret },
    });

    expect(editGitServerSecret).toHaveBeenCalledWith(secret, {
      gitProvider: gitProvider.github,
      sshPrivateKey: "private-key",
      token: "test-token",
    });
    expect(editGitServer).toHaveBeenCalledWith(gitServer, gitServerSpec);
    expect(k8s.replaceResource.mock.calls.map((args) => args[0])).toEqual([k8sSecretConfig, k8sGitServerConfig]);
  });
});
