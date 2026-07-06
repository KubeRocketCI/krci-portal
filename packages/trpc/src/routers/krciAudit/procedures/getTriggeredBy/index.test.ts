import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetInitiator = vi.fn();

vi.mock("../../../../clients/krciAudit/index.js", () => ({
  createKrciAuditClient: () => ({
    getInitiator: mockGetInitiator,
  }),
}));

describe("krciAudit.getTriggeredBy", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("classifies a human OIDC actor and looks it up by kind+namespace+name", async () => {
    mockGetInitiator.mockResolvedValue({ found: true, actor: "dev@example.com", operation: "CREATE" });

    const caller = createCaller(mockContext);
    const result = await caller.krciAudit.getTriggeredBy({ namespace: "krci", name: "run-abc" });

    expect(result).toEqual({ actorClass: "human", actor: "dev@example.com", displayName: "dev@example.com" });
    expect(mockGetInitiator).toHaveBeenCalledWith({ kind: "PipelineRun", namespace: "krci", name: "run-abc" });
  });

  it("classifies a service-account actor as automation with its short name", async () => {
    mockGetInitiator.mockResolvedValue({
      found: true,
      actor: "system:serviceaccount:krci:krci-admin",
      operation: "CREATE",
    });

    const caller = createCaller(mockContext);
    const result = await caller.krciAudit.getTriggeredBy({ namespace: "krci", name: "run-sa" });

    expect(result).toEqual({
      actorClass: "automation",
      actor: "system:serviceaccount:krci:krci-admin",
      displayName: "krci-admin",
    });
  });

  it("returns unknown when the object was never audited (found:false)", async () => {
    mockGetInitiator.mockResolvedValue({ found: false });

    const caller = createCaller(mockContext);
    const result = await caller.krciAudit.getTriggeredBy({ namespace: "krci", name: "run-never-audited" });

    expect(result).toEqual({ actorClass: "unknown" });
  });

  it("degrades (degraded:true, never throws) when krci-audit is unavailable", async () => {
    mockGetInitiator.mockRejectedValue(new Error("krci-audit unavailable"));

    const caller = createCaller(mockContext);
    const result = await caller.krciAudit.getTriggeredBy({ namespace: "krci", name: "run-down" });

    expect(result).toEqual({ actorClass: "unknown", degraded: true });
  });

  it("rejects a missing name", async () => {
    const caller = createCaller(mockContext);

    await expect(caller.krciAudit.getTriggeredBy({ namespace: "krci", name: "" })).rejects.toThrow();
  });
});
