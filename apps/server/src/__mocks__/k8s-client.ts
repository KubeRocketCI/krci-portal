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

  return new K8sClient(mockSession) as unknown as MockK8sClient;
}
