import { afterEach, beforeEach, vi, type Mock } from "vitest";
import { createMockedContext } from "../../../__mocks__/context.js";
import { createDefectDojoClient } from "../../../clients/defectdojo/index.js";
import { K8sClient } from "../../../clients/k8s/index.js";
import { createCaller } from "../../index.js";
import { DEMO_LISTS, listByKind } from "./kubernetes.js";

interface ProcedureHarness {
  getResource: Mock;
  listResource: Mock;
  defectDojoClient: { name: string; tenantTags: Mock };
  caller: ReturnType<typeof createCaller>;
}

/**
 * The setup the security procedure tests share. The test file mocks `clients/k8s` and `clients/defectdojo`
 * (`vi.mock` has to sit in the file); the harness then wires the mocked Kubernetes client, the DefectDojo client
 * and a caller, and restores the environment after each test. `resource` is what the authorization read answers.
 */
export function useProcedureHarness(resource: unknown): ProcedureHarness {
  const originalEnv = process.env;

  const harness: ProcedureHarness = {
    getResource: vi.fn(),
    listResource: vi.fn(),
    defectDojoClient: { name: "defectdojo-client", tenantTags: vi.fn((tenant: string) => ["tag-of-" + tenant]) },
    caller: undefined as unknown as ProcedureHarness["caller"],
  };

  beforeEach(() => {
    process.env = { ...originalEnv, DEFAULT_CLUSTER_NAMESPACE: "krci" };
    harness.getResource = vi.fn().mockResolvedValue(resource);
    harness.listResource = vi.fn().mockImplementation(listByKind(DEMO_LISTS));
    (K8sClient as unknown as Mock).mockImplementation(function () {
      return { KubeConfig: {}, getResource: harness.getResource, listResource: harness.listResource };
    });
    (createDefectDojoClient as Mock).mockReturnValue(harness.defectDojoClient);
    harness.caller = createCaller(createMockedContext());
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  return harness;
}
