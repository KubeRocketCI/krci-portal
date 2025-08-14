import { K8sClient } from "@/clients/k8s";
import { Mock, vi } from "vitest";
import { CustomSession } from "../trpc/context";

export type MockK8sClient = {
  KubeConfig: {
    loadFromDefault: Mock;
    loadFromCluster: Mock;
    getCurrentCluster: Mock;
    getCurrentUser: Mock;
    getCurrentContext: Mock;
    setCurrentContext: Mock;
    makeApiClient: Mock;
  };
  listResource: Mock;
  getResource: Mock;
  deleteResource: Mock;
  createResource: Mock;
  replaceResource: Mock;
  patchResource: Mock;
} & K8sClient;

export function createMockedK8sClient(
  mockSession: CustomSession
): MockK8sClient {
  vi.mock("@kubernetes/client-node", async () => {
    const actual = await vi.importActual<
      typeof import("@kubernetes/client-node")
    >("@kubernetes/client-node");

    return {
      ...actual,
      KubeConfig: vi.fn().mockImplementation(() => ({
        loadFromDefault: vi.fn(),
        loadFromCluster: vi.fn(),
        getCurrentCluster: vi.fn().mockReturnValue({ name: "test-cluster" }),
        getCurrentContext: vi.fn().mockReturnValue("test-namespace"),
        getCurrentUser: vi.fn().mockReturnValue("john_doe@world.com"),
        setCurrentContext: vi.fn(),
        makeApiClient: vi.fn(),
      })),
    };
  });

  const k8sClient = new K8sClient(mockSession);

  // Create a mock object that includes our new unified methods
  const mockK8sClient = {
    ...k8sClient,
    KubeConfig: {
      loadFromDefault: vi.fn(),
      loadFromCluster: vi.fn(),
      getCurrentCluster: vi.fn().mockReturnValue({ name: "test-cluster" }),
      getCurrentContext: vi.fn().mockReturnValue("test-namespace"),
      getCurrentUser: vi.fn().mockReturnValue("john_doe@world.com"),
      setCurrentContext: vi.fn(),
      makeApiClient: vi.fn(),
    },
    listResource: vi.fn(),
    getResource: vi.fn(),
    deleteResource: vi.fn(),
    createResource: vi.fn(),
    replaceResource: vi.fn(),
    patchResource: vi.fn(),
  };

  return mockK8sClient as MockK8sClient;
}
