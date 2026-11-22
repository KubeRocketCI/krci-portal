import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockedContext } from "../../../../__mocks__/context.js";
import { K8sClient } from "../../../../clients/k8s/index.js";
import { createCaller } from "../../../index.js";

describe("agentSubstrate.getFleet", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns notConfigured with no network call when the context holds no Agent Substrate source", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const listResourceSpy = vi.spyOn(K8sClient.prototype, "listResource");
    const getResourceSpy = vi.spyOn(K8sClient.prototype, "getResource");

    const caller = createCaller(mockContext);
    const result = await caller.agentSubstrate.getFleet({});

    expect(result).toEqual({ state: "notConfigured" });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(listResourceSpy).not.toHaveBeenCalled();
    expect(getResourceSpy).not.toHaveBeenCalled();
  });

  it("serves a signed-in user who is not an administrator", async () => {
    mockContext.session.user!.data!.groups = ["developers"];

    const caller = createCaller(mockContext);

    await expect(caller.agentSubstrate.getFleet({})).resolves.toEqual({ state: "notConfigured" });
  });

  it("rejects a caller with no session with UNAUTHORIZED", async () => {
    mockContext.session.user = undefined;

    const caller = createCaller(mockContext);

    await expect(caller.agentSubstrate.getFleet({})).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
