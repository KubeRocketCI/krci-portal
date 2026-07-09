import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";

const mockGetAuditEvents = vi.fn();

vi.mock("../../../../clients/krciAudit/index.js", () => ({
  createKrciAuditClient: () => ({
    getAuditEvents: mockGetAuditEvents,
  }),
}));

describe("krciAudit.getAuditEvents", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("allows an administrator and returns the krci-audit response", async () => {
    mockContext.session.user!.data!.groups = ["administrator"];
    mockGetAuditEvents.mockResolvedValue({ data: [], pagination: { total: 0, page: 1, perPage: 20 } });

    const caller = createCaller(mockContext);
    const result = await caller.krciAudit.getAuditEvents({ kind: "PipelineRun" });

    expect(result).toEqual({ data: [], pagination: { total: 0, page: 1, perPage: 20 } });
    expect(mockGetAuditEvents).toHaveBeenCalledWith(expect.objectContaining({ kind: "PipelineRun" }));
  });

  it("denies an authenticated non-administrator with FORBIDDEN, never calling krci-audit", async () => {
    mockContext.session.user!.data!.groups = ["group-1"];

    const caller = createCaller(mockContext);

    await expect(caller.krciAudit.getAuditEvents({})).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mockGetAuditEvents).not.toHaveBeenCalled();
  });

  it("denies when groups is undefined (fail-closed), never calling krci-audit", async () => {
    mockContext.session.user!.data!.groups = undefined;

    const caller = createCaller(mockContext);

    await expect(caller.krciAudit.getAuditEvents({})).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mockGetAuditEvents).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated caller with UNAUTHORIZED, never calling krci-audit", async () => {
    mockContext.session.user = undefined;

    const caller = createCaller(mockContext);

    await expect(caller.krciAudit.getAuditEvents({})).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(mockGetAuditEvents).not.toHaveBeenCalled();
  });
});
