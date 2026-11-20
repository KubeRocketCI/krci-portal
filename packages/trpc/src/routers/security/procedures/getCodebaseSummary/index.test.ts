import { describe, expect, it, vi, type Mock } from "vitest";
import { K8sApiError } from "@my-project/shared";
import { createDefectDojoClient } from "../../../../clients/defectdojo/index.js";
import { notConfiguredError } from "../../../../clients/http/index.js";
import { AUTHORIZED_DEV_STAGE, DEMO_IMAGES } from "../../__fixtures__/kubernetes.js";
import { useProcedureHarness } from "../../__fixtures__/procedureHarness.js";
import { getCodebaseSummary } from "../../summaries.js";

vi.mock("../../../../clients/k8s/index.js", () => ({ K8sClient: vi.fn() }));
vi.mock("../../../../clients/defectdojo/index.js", () => ({ createDefectDojoClient: vi.fn() }));
vi.mock("../../summaries.js", () => ({ getCodebaseSummary: vi.fn() }));

const SUMMARY = { status: "OK", codebase: "my-service", ci: [], runtime: [], link: "https://dd.example.com/product/3" };

describe("security.getCodebaseSummary", () => {
  const harness = useProcedureHarness({ metadata: { name: "my-service" } });
  const getSummary = () => harness.caller.security.getCodebaseSummary({ codebase: "my-service" });

  it("returns the summary of the codebase once the caller may read it, with its Stages, the images and the tenant tags", async () => {
    (getCodebaseSummary as Mock).mockResolvedValue(SUMMARY);

    expect(await getSummary()).toEqual(SUMMARY);

    expect(harness.getResource).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "Codebase" }),
      "my-service",
      "krci"
    );
    expect(getCodebaseSummary).toHaveBeenCalledWith(harness.defectDojoClient, "my-service", {
      stages: [AUTHORIZED_DEV_STAGE],
      images: DEMO_IMAGES,
      tenantTags: ["tag-of-krci"],
    });
    expect(harness.listResource.mock.calls.map(([config]) => config.kind).sort()).toEqual([
      "CDPipeline",
      "CodebaseImageStream",
      "Stage",
    ]);
  });

  it("gives the summary no runtime data when the caller may not list the CD pipelines and the image streams", async () => {
    (getCodebaseSummary as Mock).mockResolvedValue(SUMMARY);
    harness.listResource.mockRejectedValue(new K8sApiError(403, "Forbidden", "forbidden"));

    expect(await getSummary()).toEqual(SUMMARY);

    expect(getCodebaseSummary).toHaveBeenCalledWith(harness.defectDojoClient, "my-service", {
      stages: [],
      images: undefined,
      tenantTags: ["tag-of-krci"],
    });
  });

  it("fails when listing fails for a reason other than permission", async () => {
    harness.listResource.mockRejectedValue(new K8sApiError(500, "Server Error", "boom"));

    await expect(getSummary()).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    expect(getCodebaseSummary).not.toHaveBeenCalled();
  });

  it.each([
    [403, "FORBIDDEN"],
    [404, "NOT_FOUND"],
  ])("answers %i without touching DefectDojo or listing anything", async (status, code) => {
    harness.getResource.mockRejectedValue(new K8sApiError(status, "denied", "denied"));

    await expect(getSummary()).rejects.toMatchObject({ code });

    expect(createDefectDojoClient).not.toHaveBeenCalled();
    expect(harness.listResource).not.toHaveBeenCalled();
    expect(getCodebaseSummary).not.toHaveBeenCalled();
  });

  it("reports DefectDojo as not configured", async () => {
    (createDefectDojoClient as Mock).mockImplementation(() => {
      throw notConfiguredError("DefectDojo", "DEFECTDOJO_URL");
    });

    await expect(getSummary()).rejects.toMatchObject({
      cause: { name: "HttpNotConfiguredError", service: "DefectDojo" },
    });
    expect(getCodebaseSummary).not.toHaveBeenCalled();
  });

  it.each(["", "My_Service", "../secrets", "a/b"])("rejects the codebase name %j", async (codebase) => {
    await expect(harness.caller.security.getCodebaseSummary({ codebase })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });

    expect(harness.getResource).not.toHaveBeenCalled();
  });
});
