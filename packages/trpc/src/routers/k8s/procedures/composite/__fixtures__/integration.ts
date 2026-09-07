import { vi } from "vitest";
import type { Mock } from "vitest";

const namespace = "test-namespace";

const k8sResource = (kind: string, name: string) => ({
  apiVersion: "v1",
  kind,
  metadata: { name, namespace, uid: "", creationTimestamp: "" },
});

type K8sResourceStub = ReturnType<typeof k8sResource>;

/** The name every stubbed helper returns. A replace call is asserted against it. */
export const EDITED_NAME = "edited";

type MockK8sClient = { KubeConfig: object; createResource: Mock; replaceResource: Mock };

type IntegrationFixture = {
  namespace: string;
  /** What the mocked K8s client resolves with after a write. */
  written: K8sResourceStub;
  secret: K8sResourceStub;
  quickLink: K8sResourceStub;
  configMap: K8sResourceStub;
  serviceAccount: K8sResourceStub;
  gitServer: K8sResourceStub;
  jiraServer: K8sResourceStub;
  mockK8sClient: () => MockK8sClient;
};

/**
 * Stubs the named shared draft/edit helpers so a suite asserts the arguments it forwards,
 * not the manifests the shared package builds. Every stub returns a resource named EDITED_NAME.
 */
export function mockIntegrationShared<TActual extends object>(
  actual: TActual,
  helpers: readonly (keyof TActual)[]
): TActual {
  const stubs = Object.fromEntries(helpers.map((name) => [name, vi.fn(() => k8sResource("Secret", EDITED_NAME))]));
  return { ...actual, ...stubs };
}

export function integrationFixture(): IntegrationFixture {
  return {
    namespace,
    written: k8sResource("Secret", "written"),
    secret: k8sResource("Secret", "ci-secret"),
    quickLink: k8sResource("QuickLink", "quicklink"),
    configMap: k8sResource("ConfigMap", "krci-config"),
    serviceAccount: k8sResource("ServiceAccount", "registry"),
    gitServer: k8sResource("GitServer", "git-server"),
    jiraServer: k8sResource("JiraServer", "jira-server"),
    mockK8sClient: () => ({
      KubeConfig: {},
      createResource: vi.fn(),
      replaceResource: vi.fn(),
    }),
  };
}
