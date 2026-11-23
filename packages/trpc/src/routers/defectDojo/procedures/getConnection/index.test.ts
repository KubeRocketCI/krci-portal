import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../index.js";

describe("defectDojo.getConnection", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  beforeEach(() => {
    mockContext = createMockedContext();
    vi.stubEnv("DEFECTDOJO_URL", "");
    vi.stubEnv("DEFECTDOJO_TOKEN", "");
    vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("says DefectDojo is not configured when the URL and the token are not set: a state, not an error", async () => {
    const caller = createCaller(mockContext);

    await expect(caller.defectDojo.getConnection()).resolves.toEqual({ configured: false });
  });

  it.each([
    ["the URL", { DEFECTDOJO_URL: "http://defectdojo.defectdojo", DEFECTDOJO_TOKEN: "" }],
    ["the token", { DEFECTDOJO_URL: "", DEFECTDOJO_TOKEN: "service-token" }],
  ])("says DefectDojo is not configured without %s", async (_, env) => {
    for (const [name, value] of Object.entries(env)) {
      vi.stubEnv(name, value);
    }
    const caller = createCaller(mockContext);

    await expect(caller.defectDojo.getConnection()).resolves.toEqual({ configured: false });
  });

  it("says DefectDojo is configured when the URL and the token are set, without a request to DefectDojo", async () => {
    vi.stubEnv("DEFECTDOJO_URL", "http://defectdojo.defectdojo");
    vi.stubEnv("DEFECTDOJO_TOKEN", "service-token");
    const caller = createCaller(mockContext);

    const connection = await caller.defectDojo.getConnection();

    expect(connection).toEqual({ configured: true });
    expect(JSON.stringify(connection)).not.toContain("defectdojo.defectdojo");
    expect(JSON.stringify(connection)).not.toContain("service-token");
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("rejects a caller with no session with UNAUTHORIZED", async () => {
    mockContext.session.user = undefined;
    const caller = createCaller(mockContext);

    await expect(caller.defectDojo.getConnection()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
