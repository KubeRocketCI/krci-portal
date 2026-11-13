import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { K8sApiError } from "@my-project/shared";
import { createMockedContext } from "../../../../__mocks__/context.js";
import { createDefectDojoClient } from "../../../../clients/defectdojo/index.js";
import { K8sClient } from "../../../../clients/k8s/index.js";
import { notConfiguredError } from "../../../../clients/http/index.js";
import { createCaller } from "../../../index.js";
import { getEnvironmentSummary } from "../../summaries.js";

vi.mock("../../../../clients/k8s/index.js", () => ({ K8sClient: vi.fn() }));
vi.mock("../../../../clients/defectdojo/index.js", () => ({ createDefectDojoClient: vi.fn() }));
vi.mock("../../summaries.js", () => ({ getEnvironmentSummary: vi.fn() }));

const SUMMARY = { status: "OK", environment: "demo/dev", applications: [] };

describe("security.getEnvironmentSummary", () => {
  const originalEnv = process.env;
  const defectDojoClient = { name: "defectdojo-client" };
  let getResource: Mock;
  let caller: ReturnType<typeof createCaller>;

  beforeEach(() => {
    process.env = { ...originalEnv, DEFAULT_CLUSTER_NAMESPACE: "krci" };
    getResource = vi.fn().mockResolvedValue({ spec: { cdPipeline: "demo", name: "dev" } });
    (K8sClient as unknown as Mock).mockImplementation(function () {
      return { KubeConfig: {}, getResource };
    });
    (createDefectDojoClient as Mock).mockReturnValue(defectDojoClient);
    (getEnvironmentSummary as Mock).mockResolvedValue(SUMMARY);
    caller = createCaller(createMockedContext());
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it("returns the summary of the environment once the caller may read the Stage", async () => {
    const result = await caller.security.getEnvironmentSummary({ cdPipeline: "demo", stage: "dev" });

    expect(result).toEqual(SUMMARY);
    expect(getResource).toHaveBeenCalledWith(expect.objectContaining({ kind: "Stage" }), "demo-dev", "krci");
    expect(getEnvironmentSummary).toHaveBeenCalledWith(defectDojoClient, "demo", "dev", "krci");
  });

  it.each([
    [403, "FORBIDDEN"],
    [404, "NOT_FOUND"],
  ])("answers %i without touching DefectDojo", async (status, code) => {
    getResource.mockRejectedValue(new K8sApiError(status, "denied", "denied"));

    await expect(caller.security.getEnvironmentSummary({ cdPipeline: "demo", stage: "dev" })).rejects.toMatchObject({
      code,
    });

    expect(createDefectDojoClient).not.toHaveBeenCalled();
    expect(getEnvironmentSummary).not.toHaveBeenCalled();
  });

  it("reports DefectDojo as not configured", async () => {
    (createDefectDojoClient as Mock).mockImplementation(() => {
      throw notConfiguredError("DefectDojo", "DEFECTDOJO_URL");
    });

    await expect(caller.security.getEnvironmentSummary({ cdPipeline: "demo", stage: "dev" })).rejects.toMatchObject({
      cause: { name: "HttpNotConfiguredError", service: "DefectDojo" },
    });
  });

  it.each([
    { cdPipeline: "", stage: "dev" },
    { cdPipeline: "demo", stage: "" },
    { cdPipeline: "Demo", stage: "dev" },
    { cdPipeline: "demo", stage: "dev.v2" },
    { cdPipeline: "demo/dev", stage: "dev" },
  ])("rejects %j", async (input) => {
    await expect(caller.security.getEnvironmentSummary(input)).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(getResource).not.toHaveBeenCalled();
  });
});
