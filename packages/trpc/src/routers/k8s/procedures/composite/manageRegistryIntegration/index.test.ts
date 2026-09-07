import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import {
  containerRegistryType,
  createPullAccountRegistrySecretDraft,
  createPushAccountRegistrySecretDraft,
  editKRCIConfigMapRegistryData,
  editPullAccountRegistrySecret,
  editPushAccountRegistrySecret,
  editRegistryServiceAccount,
  k8sConfigMapConfig,
  k8sSecretConfig,
  k8sServiceAccountConfig,
} from "@my-project/shared";
import { createMockedContext } from "../../../../../__mocks__/context.js";
import { K8sClient } from "../../../../../clients/k8s/index.js";
import { createCaller } from "../../../../../routers/index.js";
import { EDITED_NAME, integrationFixture } from "../__fixtures__/integration.js";

vi.mock("../../../../../clients/k8s/index.js", () => ({ K8sClient: vi.fn() }));

vi.mock("@my-project/shared", async (importOriginal) => {
  const { mockIntegrationShared } = await import("../__fixtures__/integration.js");
  return mockIntegrationShared(await importOriginal<typeof import("@my-project/shared")>(), [
    "editKRCIConfigMapRegistryData",
    "createPullAccountRegistrySecretDraft",
    "editPullAccountRegistrySecret",
    "createPushAccountRegistrySecretDraft",
    "editPushAccountRegistrySecret",
    "editRegistryServiceAccount",
  ]);
});

const { namespace, configMap, secret, serviceAccount, written, mockK8sClient } = integrationFixture();

const registry = {
  registryType: containerRegistryType.harbor,
  registrySpace: "krci",
  registryEndpoint: "harbor.example.com",
};

const baseInput = {
  clusterName: "test-cluster",
  namespace,
  mode: "edit" as const,
  dirtyFields: { configMap: false, pullAccountSecret: false, pushAccountSecret: false, serviceAccount: false },
  configMap: registry,
  pullAccountSecret: { user: "pull-user", password: "pull-password" },
  pushAccountSecret: { user: "push-user", password: "push-password" },
};

describe("k8sManageRegistryIntegrationProcedure", () => {
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

  it("creates both account secrets with the registry type and endpoint", async () => {
    k8s.createResource.mockResolvedValue(written);

    const result = await createCaller(mockContext).k8s.manageRegistryIntegration({
      ...baseInput,
      mode: "create",
      dirtyFields: { ...baseInput.dirtyFields, pullAccountSecret: true, pushAccountSecret: true },
    });

    expect(createPullAccountRegistrySecretDraft).toHaveBeenCalledWith({
      registryType: containerRegistryType.harbor,
      registryEndpoint: "harbor.example.com",
      user: "pull-user",
      password: "pull-password",
    });
    expect(createPushAccountRegistrySecretDraft).toHaveBeenCalledWith({
      registryType: containerRegistryType.harbor,
      registryEndpoint: "harbor.example.com",
      user: "push-user",
      password: "push-password",
    });
    expect(k8s.createResource.mock.calls.map((args) => args[0])).toEqual([k8sSecretConfig, k8sSecretConfig]);
    expect(result.data.pullAccountSecret).toEqual(written);
    expect(result.data.pushAccountSecret).toEqual(written);
  });

  it("edits the ConfigMap even in create mode, dropping absent optional fields", async () => {
    k8s.replaceResource.mockResolvedValueOnce(written);

    await createCaller(mockContext).k8s.manageRegistryIntegration({
      ...baseInput,
      mode: "create",
      dirtyFields: { ...baseInput.dirtyFields, configMap: true },
      configMap: { ...registry, currentResource: configMap },
    });

    expect(editKRCIConfigMapRegistryData).toHaveBeenCalledWith(configMap, {
      registryType: containerRegistryType.harbor,
      registrySpace: "krci",
      registryEndpoint: "harbor.example.com",
    });
    expect(k8s.replaceResource).toHaveBeenCalledWith(k8sConfigMapConfig, EDITED_NAME, namespace, expect.anything());
  });

  it("carries the AWS region into the ConfigMap for ECR", async () => {
    k8s.replaceResource.mockResolvedValueOnce(written);

    await createCaller(mockContext).k8s.manageRegistryIntegration({
      ...baseInput,
      dirtyFields: { ...baseInput.dirtyFields, configMap: true },
      configMap: {
        registryType: containerRegistryType.ecr,
        registrySpace: "krci",
        awsRegion: "eu-central-1",
        currentResource: configMap,
      },
    });

    expect(editKRCIConfigMapRegistryData).toHaveBeenCalledWith(configMap, {
      registryType: containerRegistryType.ecr,
      registrySpace: "krci",
      awsRegion: "eu-central-1",
    });
  });

  it("patches the live account secrets in edit mode", async () => {
    k8s.replaceResource.mockResolvedValue(written);

    await createCaller(mockContext).k8s.manageRegistryIntegration({
      ...baseInput,
      dirtyFields: { ...baseInput.dirtyFields, pullAccountSecret: true, pushAccountSecret: true },
      pullAccountSecret: { ...baseInput.pullAccountSecret, currentResource: secret },
      pushAccountSecret: { ...baseInput.pushAccountSecret, currentResource: secret },
    });

    expect(editPullAccountRegistrySecret).toHaveBeenCalledWith(secret, {
      registryType: containerRegistryType.harbor,
      registryEndpoint: "harbor.example.com",
      user: "pull-user",
      password: "pull-password",
    });
    expect(editPushAccountRegistrySecret).toHaveBeenCalledWith(secret, {
      registryType: containerRegistryType.harbor,
      registryEndpoint: "harbor.example.com",
      user: "push-user",
      password: "push-password",
    });
  });

  it("patches the ServiceAccount with the IRSA role", async () => {
    k8s.replaceResource.mockResolvedValueOnce(written);

    await createCaller(mockContext).k8s.manageRegistryIntegration({
      ...baseInput,
      dirtyFields: { ...baseInput.dirtyFields, serviceAccount: true },
      serviceAccount: { irsaRoleArn: "arn:aws:iam::1:role/ecr", currentResource: serviceAccount },
    });

    expect(editRegistryServiceAccount).toHaveBeenCalledWith(serviceAccount, {
      irsaRoleArn: "arn:aws:iam::1:role/ecr",
    });
    expect(k8s.replaceResource).toHaveBeenCalledWith(
      k8sServiceAccountConfig,
      EDITED_NAME,
      namespace,
      expect.anything()
    );
  });

  it("writes the four resources in ConfigMap, pull, push, ServiceAccount order", async () => {
    k8s.replaceResource.mockResolvedValue(written);

    await createCaller(mockContext).k8s.manageRegistryIntegration({
      ...baseInput,
      dirtyFields: { configMap: true, pullAccountSecret: true, pushAccountSecret: true, serviceAccount: true },
      configMap: { ...registry, currentResource: configMap },
      pullAccountSecret: { ...baseInput.pullAccountSecret, currentResource: secret },
      pushAccountSecret: { ...baseInput.pushAccountSecret, currentResource: secret },
      serviceAccount: { irsaRoleArn: "arn:aws:iam::1:role/ecr", currentResource: serviceAccount },
    });

    expect(k8s.replaceResource.mock.calls.map((args) => args[0])).toEqual([
      k8sConfigMapConfig,
      k8sSecretConfig,
      k8sSecretConfig,
      k8sServiceAccountConfig,
    ]);
  });
});
