import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { K8sApiError } from "@my-project/shared";
import { createMockedContext } from "../../../../__mocks__/context.js";
import { createDefectDojoClient } from "../../../../clients/defectdojo/index.js";
import { K8sClient } from "../../../../clients/k8s/index.js";
import { notConfiguredError } from "../../../../clients/http/index.js";
import { createCaller } from "../../../index.js";
import { getCodebaseSummary } from "../../summaries.js";

vi.mock("../../../../clients/k8s/index.js", () => ({ K8sClient: vi.fn() }));
vi.mock("../../../../clients/defectdojo/index.js", () => ({ createDefectDojoClient: vi.fn() }));
vi.mock("../../summaries.js", () => ({ getCodebaseSummary: vi.fn() }));

const SUMMARY = { status: "OK", codebase: "my-service", ci: [], runtime: [], link: "https://dd.example.com/product/3" };

describe("security.getCodebaseSummary", () => {
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
    (getCodebaseSummary as Mock).mockResolvedValue(SUMMARY);
    caller = createCaller(createMockedContext());
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it("returns the summary of the codebase once the caller may read it", async () => {
    const result = await caller.security.getCodebaseSummary({ codebase: "my-service" });

    expect(result).toEqual(SUMMARY);
    expect(getResource).toHaveBeenCalledWith(expect.objectContaining({ kind: "Codebase" }), "my-service", "krci");
    expect(getCodebaseSummary).toHaveBeenCalledWith(defectDojoClient, "my-service", "krci");
  });

  it.each([
    [403, "FORBIDDEN"],
    [404, "NOT_FOUND"],
  ])("answers %i without touching DefectDojo", async (status, code) => {
    getResource.mockRejectedValue(new K8sApiError(status, "denied", "denied"));

    await expect(caller.security.getCodebaseSummary({ codebase: "my-service" })).rejects.toMatchObject({ code });

    expect(createDefectDojoClient).not.toHaveBeenCalled();
    expect(getCodebaseSummary).not.toHaveBeenCalled();
  });

  it("reports DefectDojo as not configured", async () => {
    (createDefectDojoClient as Mock).mockImplementation(() => {
      throw notConfiguredError("DefectDojo", "DEFECTDOJO_URL");
    });

    await expect(caller.security.getCodebaseSummary({ codebase: "my-service" })).rejects.toMatchObject({
      cause: { name: "HttpNotConfiguredError", service: "DefectDojo" },
    });
    expect(getCodebaseSummary).not.toHaveBeenCalled();
  });

  it.each(["", "My_Service", "../secrets", "a/b"])("rejects the codebase name %j", async (codebase) => {
    await expect(caller.security.getCodebaseSummary({ codebase })).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(getResource).not.toHaveBeenCalled();
  });
});
