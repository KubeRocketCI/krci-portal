import { createMockedContext } from "../../../../__mocks__/context.js";
import { createCaller } from "../../../../routers/index.js";
import { TRPCError } from "@trpc/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuthSA } = vi.hoisted(() => ({ mockAuthSA: vi.fn() }));

vi.mock("../../../../utils/authenticateServiceAccountToken/index.js", () => ({
  authenticateServiceAccountToken: mockAuthSA,
}));

describe("authLoginWithServiceAccountTokenProcedure", () => {
  let mockContext: ReturnType<typeof createMockedContext>;

  const data = {
    sub: "u1",
    name: "edp-admin",
    preferred_username: "system:serviceaccount:edp:edp-admin",
    email: "",
    groups: ["system:authenticated"],
    default_namespace: "edp",
  };

  const secret = {
    idToken: "sa-token",
    idTokenExpiresAt: 1234567890,
    accessToken: "sa-token",
    accessTokenExpiresAt: 1234567890,
    refreshToken: "",
  };

  beforeEach(() => {
    mockContext = createMockedContext();
    mockAuthSA.mockResolvedValue({ data, secret });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("validates the SA token, sets the session, and returns user info", async () => {
    const caller = createCaller(mockContext);
    const result = await caller.auth.loginWithServiceAccountToken({ token: "sa-token" });

    expect(mockAuthSA).toHaveBeenCalledWith("sa-token");
    expect(result.success).toBe(true);
    expect(result.userInfo).toMatchObject({
      sub: "u1",
      name: "edp-admin",
      default_namespace: "edp",
    });
    expect(result.clientSearch).toBe("");
    expect(mockContext.session.user).toEqual({ data, secret });
  });

  it("includes redirect in clientSearch when redirectSearchParam is provided", async () => {
    const caller = createCaller(mockContext);
    const result = await caller.auth.loginWithServiceAccountToken({
      token: "sa-token",
      redirectSearchParam: "/pipelines",
    });

    expect(result.clientSearch).toBe("?redirect=/pipelines");
  });

  it("propagates UNAUTHORIZED and leaves session.user unset on rejection", async () => {
    mockContext.session.user = undefined as unknown as typeof mockContext.session.user;
    mockAuthSA.mockRejectedValueOnce(
      new TRPCError({ code: "UNAUTHORIZED", message: "The service account token was rejected by the cluster." })
    );

    const caller = createCaller(mockContext);

    await expect(caller.auth.loginWithServiceAccountToken({ token: "bad-token" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(mockContext.session.user).toBeUndefined();
  });
});
