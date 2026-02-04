import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildAuthorizationUrl } from "openid-client";

describe("authLoginProcedure", () => {
  let mockContext: ReturnType<typeof createMockedContext>;
  let caller: ReturnType<typeof createCaller>;

  beforeEach(() => {
    mockContext = createMockedContext();
    vi.clearAllMocks();
    caller = createCaller(mockContext);
  });

  it("should generate auth URL and update session correctly", async () => {
    const input = "/auth/callback?redirect=/pipelines";

    const result = await caller.auth.login(input);

    expect(result).toEqual({ authUrl: "https://example.com/auth" });

    expect(mockContext.session.login).toEqual({
      clientSearch: "?redirect=/pipelines",
      openId: {
        state: "random-state",
        codeVerifier: "verifier123",
      },
    });

    // Verify the redirect URI was resolved against portalUrl and cleaned of search params
    expect(buildAuthorizationUrl).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        redirect_uri: `${mockContext.portalUrl}/auth/callback`,
      })
    );
  });

  it("should initialize session.login if it doesn't exist", async () => {
    mockContext.session.login = undefined;

    const input = "/auth/callback";

    const result = await caller.auth.login(input);

    expect(result).toEqual({ authUrl: "https://example.com/auth" });

    expect(mockContext.session.login).toEqual({
      clientSearch: "",
      openId: {
        state: "random-state",
        codeVerifier: "verifier123",
      },
    });
  });

  it("should reject input that does not start with /", async () => {
    await expect(caller.auth.login("https://evil.com/callback")).rejects.toThrow();
  });

  it("should reject input without leading slash", async () => {
    await expect(caller.auth.login("auth/callback")).rejects.toThrow();
  });
});
