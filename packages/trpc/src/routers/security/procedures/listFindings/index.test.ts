import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { K8sApiError } from "@my-project/shared";
import { createMockedContext } from "../../../../__mocks__/context.js";
import { createDefectDojoClient } from "../../../../clients/defectdojo/index.js";
import { K8sClient } from "../../../../clients/k8s/index.js";
import { notConfiguredError } from "../../../../clients/http/index.js";
import { createCaller } from "../../../index.js";
import { getFindingsPage } from "../../summaries.js";

vi.mock("../../../../clients/k8s/index.js", () => ({ K8sClient: vi.fn() }));
vi.mock("../../../../clients/defectdojo/index.js", () => ({ createDefectDojoClient: vi.fn() }));
vi.mock("../../summaries.js", () => ({ getFindingsPage: vi.fn() }));

const PAGE = { status: "OK", items: [], totalCount: 0, page: 1, pageSize: 25 };

describe("security.listFindings", () => {
  const originalEnv = process.env;
  const defectDojoClient = { name: "defectdojo-client" };
  let getResource: Mock;
  let caller: ReturnType<typeof createCaller>;

  beforeEach(() => {
    process.env = { ...originalEnv, DEFAULT_CLUSTER_NAMESPACE: "krci" };
    getResource = vi.fn().mockResolvedValue({ metadata: { name: "my-service" } });
    (K8sClient as unknown as Mock).mockImplementation(function () {
      return { KubeConfig: {}, getResource };
    });
    (createDefectDojoClient as Mock).mockReturnValue(defectDojoClient);
    (getFindingsPage as Mock).mockResolvedValue(PAGE);
    caller = createCaller(createMockedContext());
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it("defaults to the first page of 25 findings", async () => {
    const result = await caller.security.listFindings({ codebase: "my-service", scope: "ci" });

    expect(result).toEqual(PAGE);
    expect(getResource).toHaveBeenCalledWith(expect.objectContaining({ kind: "Codebase" }), "my-service", "krci");
    expect(getFindingsPage).toHaveBeenCalledWith(
      defectDojoClient,
      { codebase: "my-service", scope: "ci", page: 1, pageSize: 25 },
      "krci"
    );
  });

  it("passes every filter", async () => {
    const input = {
      codebase: "my-service",
      scope: "runtime",
      environment: "demo/dev",
      severity: ["critical", "unassigned"],
      page: 2,
      pageSize: 100,
    } as const;

    await caller.security.listFindings({ ...input, severity: [...input.severity] });

    expect(getFindingsPage).toHaveBeenCalledWith(defectDojoClient, { ...input, severity: [...input.severity] }, "krci");
  });

  it.each([
    [403, "FORBIDDEN"],
    [404, "NOT_FOUND"],
  ])("answers %i without touching DefectDojo", async (status, code) => {
    getResource.mockRejectedValue(new K8sApiError(status, "denied", "denied"));

    await expect(caller.security.listFindings({ codebase: "my-service", scope: "ci" })).rejects.toMatchObject({ code });

    expect(createDefectDojoClient).not.toHaveBeenCalled();
    expect(getFindingsPage).not.toHaveBeenCalled();
  });

  it("reports DefectDojo as not configured", async () => {
    (createDefectDojoClient as Mock).mockImplementation(() => {
      throw notConfiguredError("DefectDojo", "DEFECTDOJO_URL");
    });

    await expect(caller.security.listFindings({ codebase: "my-service", scope: "ci" })).rejects.toMatchObject({
      cause: { name: "HttpNotConfiguredError", service: "DefectDojo" },
    });
  });

  it.each([
    { page: 0 },
    { page: 1.5 },
    { page: 1001 },
    { page: 10 ** 21 },
    { scope: undefined },
    { pageSize: 0 },
    { pageSize: 101 },
    { scope: "prod" },
    { environment: "demo" },
    { environment: "demo/dev/extra" },
    { severity: ["info"] },
  ])("rejects %j", async (invalid) => {
    await expect(caller.security.listFindings({ codebase: "my-service", ...invalid } as never)).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });

    expect(getResource).not.toHaveBeenCalled();
  });
});
