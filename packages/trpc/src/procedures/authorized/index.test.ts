import { describe, expect, it, vi } from "vitest";
import { t } from "../../trpc.js";
import { createMockedContext } from "../../__mocks__/context.js";
import { adminProcedure, authorizedProcedure } from "./index.js";

// Local router — isolates this test from the shared __mocks__/router.ts, which
// is also exercised by protected/index.test.ts.
const downstreamBody = vi.fn(() => "downstream-called");

const testRouter = t.router({
  testAdmin: adminProcedure.query(downstreamBody),
  testDeveloper: authorizedProcedure("administrator").query(downstreamBody),
});

const createCaller = t.createCallerFactory(testRouter);

describe("authorizedProcedure / adminProcedure", () => {
  it("allows an administrator through and runs the procedure body", async () => {
    downstreamBody.mockClear();
    const mockContext = createMockedContext();
    mockContext.session.user!.data!.groups = ["administrator"];

    const caller = createCaller(mockContext);
    const result = await caller.testAdmin();

    expect(result).toBe("downstream-called");
    expect(downstreamBody).toHaveBeenCalledTimes(1);
  });

  it("rejects a serviceaccount session even when its groups match the admin binding", async () => {
    // Server enforcement is source-gated identically to auth.me: an SA never satisfies a
    // role check, so K8s groups that happen to match PORTAL_ADMIN_GROUPS grant nothing.
    downstreamBody.mockClear();
    const mockContext = createMockedContext();
    mockContext.session.user!.authSource = "serviceaccount";
    mockContext.session.user!.data!.groups = ["administrator"];

    const caller = createCaller(mockContext);

    await expect(caller.testAdmin()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(downstreamBody).not.toHaveBeenCalled();
  });

  it("rejects an authenticated non-member with FORBIDDEN and never runs the body", async () => {
    downstreamBody.mockClear();
    const mockContext = createMockedContext();
    mockContext.session.user!.data!.groups = ["group-1", "group-2"];

    const caller = createCaller(mockContext);

    await expect(caller.testAdmin()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(downstreamBody).not.toHaveBeenCalled();
  });

  it("rejects when groups is undefined (fail-closed) and never runs the body", async () => {
    downstreamBody.mockClear();
    const mockContext = createMockedContext();
    mockContext.session.user!.data!.groups = undefined;

    const caller = createCaller(mockContext);

    await expect(caller.testAdmin()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(downstreamBody).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated caller with UNAUTHORIZED (delegates to protectedProcedure)", async () => {
    const mockContext = createMockedContext();
    mockContext.session.user = undefined;

    const caller = createCaller(mockContext);

    await expect(caller.testAdmin()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
