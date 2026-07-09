import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";

const mockGetFacets = vi.fn();

vi.mock("../../../../clients/krciAudit/index.js", () => ({
  createKrciAuditClient: () => ({
    getFacets: mockGetFacets,
  }),
}));

describe("krciAudit.getAuditFacets", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("allows an administrator and returns the krci-audit facets response", async () => {
    mockContext.session.user!.data!.groups = ["administrator"];
    mockGetFacets.mockResolvedValue({
      namespace: { values: ["default", "krci"], truncated: false },
      kind: { values: ["PipelineRun"], truncated: false },
      actor: { values: [], truncated: true },
    });

    const caller = createCaller(mockContext);
    const result = await caller.krciAudit.getAuditFacets({ fields: ["namespace", "kind", "actor"] });

    expect(result).toEqual({
      namespace: { values: ["default", "krci"], truncated: false },
      kind: { values: ["PipelineRun"], truncated: false },
      actor: { values: [], truncated: true },
    });
    expect(mockGetFacets).toHaveBeenCalledWith(["namespace", "kind", "actor"]);
  });

  it("defaults to all three fields when none are requested", async () => {
    mockContext.session.user!.data!.groups = ["administrator"];
    mockGetFacets.mockResolvedValue({});

    const caller = createCaller(mockContext);
    await caller.krciAudit.getAuditFacets({});

    expect(mockGetFacets).toHaveBeenCalledWith(["namespace", "kind", "actor"]);
  });

  it("denies an authenticated non-administrator with FORBIDDEN, never calling krci-audit", async () => {
    mockContext.session.user!.data!.groups = ["group-1"];

    const caller = createCaller(mockContext);

    await expect(caller.krciAudit.getAuditFacets({})).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mockGetFacets).not.toHaveBeenCalled();
  });

  it("denies when groups is undefined (fail-closed), never calling krci-audit", async () => {
    mockContext.session.user!.data!.groups = undefined;

    const caller = createCaller(mockContext);

    await expect(caller.krciAudit.getAuditFacets({})).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mockGetFacets).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated caller with UNAUTHORIZED, never calling krci-audit", async () => {
    mockContext.session.user = undefined;

    const caller = createCaller(mockContext);

    await expect(caller.krciAudit.getAuditFacets({})).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(mockGetFacets).not.toHaveBeenCalled();
  });
});
