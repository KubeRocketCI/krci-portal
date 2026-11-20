import { describe, expect, it, vi, type Mock } from "vitest";
import { K8sApiError } from "@my-project/shared";
import { createDefectDojoClient } from "../../../../clients/defectdojo/index.js";
import { notConfiguredError } from "../../../../clients/http/index.js";
import { AUTHORIZED_DEV_STAGE, DEMO_IMAGES } from "../../__fixtures__/kubernetes.js";
import { useProcedureHarness } from "../../__fixtures__/procedureHarness.js";
import { getCiFindingsPage, getRuntimeFindingsPage } from "../../summaries.js";

vi.mock("../../../../clients/k8s/index.js", () => ({ K8sClient: vi.fn() }));
vi.mock("../../../../clients/defectdojo/index.js", () => ({ createDefectDojoClient: vi.fn() }));
vi.mock("../../summaries.js", () => ({ getCiFindingsPage: vi.fn(), getRuntimeFindingsPage: vi.fn() }));

const PAGE = { status: "OK", items: [], totalCount: 0, page: 1, pageSize: 25 };

describe("security.listFindings", () => {
  const harness = useProcedureHarness({ metadata: { name: "my-service" } });
  const CI = { codebase: "my-service", scope: "ci" } as const;
  const RUNTIME = { codebase: "my-service", scope: "runtime" } as const;

  it("reads the CI page with the defaults of the first page of 25 findings, and no Kubernetes data", async () => {
    (getCiFindingsPage as Mock).mockResolvedValue(PAGE);

    expect(await harness.caller.security.listFindings(CI)).toEqual(PAGE);

    expect(harness.getResource).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "Codebase" }),
      "my-service",
      "krci"
    );
    expect(getCiFindingsPage).toHaveBeenCalledWith(harness.defectDojoClient, { ...CI, page: 1, pageSize: 25 });
    expect(getRuntimeFindingsPage).not.toHaveBeenCalled();
    expect(harness.listResource).not.toHaveBeenCalled();
  });

  it("reads the runtime page with the Stages of the codebase, the images and the tenant tags", async () => {
    (getRuntimeFindingsPage as Mock).mockResolvedValue(PAGE);

    await harness.caller.security.listFindings(RUNTIME);

    expect(getRuntimeFindingsPage).toHaveBeenCalledWith(
      harness.defectDojoClient,
      { ...RUNTIME, page: 1, pageSize: 25 },
      { stages: [AUTHORIZED_DEV_STAGE], images: DEMO_IMAGES, tenantTags: ["tag-of-krci"] }
    );
    expect(getCiFindingsPage).not.toHaveBeenCalled();
  });

  it("gives the runtime page no Stages and no images when the caller may not list them", async () => {
    harness.listResource.mockRejectedValue(new K8sApiError(403, "Forbidden", "forbidden"));

    await harness.caller.security.listFindings(RUNTIME);

    expect(getRuntimeFindingsPage).toHaveBeenCalledWith(harness.defectDojoClient, expect.anything(), {
      stages: [],
      images: undefined,
      tenantTags: ["tag-of-krci"],
    });
  });

  it("passes every filter", async () => {
    const input = {
      ...RUNTIME,
      environment: "demo/dev",
      severity: ["critical", "unassigned"],
      page: 2,
      pageSize: 100,
    } as const;

    await harness.caller.security.listFindings({ ...input, severity: [...input.severity] });

    expect(getRuntimeFindingsPage).toHaveBeenCalledWith(
      harness.defectDojoClient,
      { ...input, severity: [...input.severity] },
      expect.anything()
    );
  });

  it.each([
    [403, "FORBIDDEN"],
    [404, "NOT_FOUND"],
  ])("answers %i without touching DefectDojo or listing anything", async (status, code) => {
    harness.getResource.mockRejectedValue(new K8sApiError(status, "denied", "denied"));

    await expect(harness.caller.security.listFindings(CI)).rejects.toMatchObject({ code });

    expect(createDefectDojoClient).not.toHaveBeenCalled();
    expect(harness.listResource).not.toHaveBeenCalled();
    expect(getCiFindingsPage).not.toHaveBeenCalled();
  });

  it("reports DefectDojo as not configured", async () => {
    (createDefectDojoClient as Mock).mockImplementation(() => {
      throw notConfiguredError("DefectDojo", "DEFECTDOJO_URL");
    });

    await expect(harness.caller.security.listFindings(CI)).rejects.toMatchObject({
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
    await expect(harness.caller.security.listFindings({ ...CI, ...invalid } as never)).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });

    expect(harness.getResource).not.toHaveBeenCalled();
  });
});
