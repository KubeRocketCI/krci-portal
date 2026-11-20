import { describe, expect, it, vi, type Mock } from "vitest";
import { K8sApiError } from "@my-project/shared";
import { createDefectDojoClient } from "../../../../clients/defectdojo/index.js";
import { notConfiguredError } from "../../../../clients/http/index.js";
import { AUTHORIZED_DEV_STAGE, DEMO_DEV_STAGE, DEMO_IMAGES } from "../../__fixtures__/kubernetes.js";
import { useProcedureHarness } from "../../__fixtures__/procedureHarness.js";
import { getEnvironmentSummary } from "../../summaries.js";

vi.mock("../../../../clients/k8s/index.js", () => ({ K8sClient: vi.fn() }));
vi.mock("../../../../clients/defectdojo/index.js", () => ({ createDefectDojoClient: vi.fn() }));
vi.mock("../../summaries.js", () => ({ getEnvironmentSummary: vi.fn() }));

const SUMMARY = { status: "OK", environment: "demo/dev", applications: [] };

describe("security.getEnvironmentSummary", () => {
  const harness = useProcedureHarness(DEMO_DEV_STAGE);
  const getSummary = () => harness.caller.security.getEnvironmentSummary({ cdPipeline: "demo", stage: "dev" });

  it("returns the summary of the environment once the caller may read the Stage, with the images and the tenant tags", async () => {
    (getEnvironmentSummary as Mock).mockResolvedValue(SUMMARY);

    expect(await getSummary()).toEqual(SUMMARY);

    expect(harness.getResource).toHaveBeenCalledWith(expect.objectContaining({ kind: "Stage" }), "demo-dev", "krci");
    expect(getEnvironmentSummary).toHaveBeenCalledWith(harness.defectDojoClient, AUTHORIZED_DEV_STAGE, {
      images: DEMO_IMAGES,
      tenantTags: ["tag-of-krci"],
    });
    expect(harness.listResource).toHaveBeenCalledTimes(1);
    expect(harness.listResource).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "CodebaseImageStream" }),
      "krci",
      ""
    );
  });

  it("gives the summary no images when the caller may not list the image streams", async () => {
    harness.listResource.mockRejectedValue(new K8sApiError(403, "Forbidden", "forbidden"));

    await getSummary();

    expect(getEnvironmentSummary).toHaveBeenCalledWith(harness.defectDojoClient, expect.anything(), {
      images: undefined,
      tenantTags: ["tag-of-krci"],
    });
  });

  it.each([
    [403, "FORBIDDEN"],
    [404, "NOT_FOUND"],
  ])("answers %i without touching DefectDojo or listing anything", async (status, code) => {
    harness.getResource.mockRejectedValue(new K8sApiError(status, "denied", "denied"));

    await expect(getSummary()).rejects.toMatchObject({ code });

    expect(createDefectDojoClient).not.toHaveBeenCalled();
    expect(harness.listResource).not.toHaveBeenCalled();
    expect(getEnvironmentSummary).not.toHaveBeenCalled();
  });

  it("reports DefectDojo as not configured", async () => {
    (createDefectDojoClient as Mock).mockImplementation(() => {
      throw notConfiguredError("DefectDojo", "DEFECTDOJO_URL");
    });

    await expect(getSummary()).rejects.toMatchObject({
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
    await expect(harness.caller.security.getEnvironmentSummary(input)).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(harness.getResource).not.toHaveBeenCalled();
  });
});
