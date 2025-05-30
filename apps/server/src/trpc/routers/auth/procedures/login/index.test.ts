// import { describe, it, expect, vi, beforeEach } from "vitest";
// import { createMockedContext } from "@/__mocks__/context";
// import { createCaller } from "@/trpc/routers";
// import { buildAuthorizationUrl, discovery, randomState } from "openid-client";

// describe("authLoginProcedure", () => {
//   let mockContext: ReturnType<typeof createMockedContext>;
//   let caller: ReturnType<typeof createCaller>;

//   beforeEach(() => {
//     // Create mocked context
//     mockContext = createMockedContext();

//     // Reset mocks
//     vi.clearAllMocks();

//     // Create caller with mocked context
//     caller = createCaller(mockContext);
//   });

//   it("should generate auth URL and update session correctly", async () => {
//     const input = "https://redirect.com?param=test";
//     const expectedAuthUrl = "https://example.com/auth";

//     // Call the procedure
//     const result = await caller.auth.login(input);

//     // Verify the result
//     expect(result).toEqual({ authUrl: expectedAuthUrl });

//     // Verify session updates
//     expect(mockContext.session.login).toEqual({
//       clientSearch: "?param=test",
//       openId: {
//         state: "random-state",
//         codeVerifier: "verifier123",
//       },
//     });

//     // Verify the redirect URI was cleaned
//     expect(buildAuthorizationUrl).toHaveBeenCalledWith(
//       expect.anything(),
//       expect.objectContaining({
//         redirect_uri: "https://redirect.com/",
//       })
//     );
//   });

//   it("should initialize session.login if it doesn't exist", async () => {
//     // Clear existing session.login
//     mockContext.session.login = undefined;

//     const input = "https://redirect.com";
//     const expectedAuthUrl = "https://example.com/auth";

//     // Call the procedure
//     const result = await caller.auth.login(input);

//     // Verify the result
//     expect(result).toEqual({ authUrl: expectedAuthUrl });

//     // Verify session was initialized and updated
//     expect(mockContext.session.login).toEqual({
//       clientSearch: "",
//       openId: {
//         state: "random-state",
//         codeVerifier: "verifier123",
//       },
//     });
//   });

//   it("should throw error if input URL is invalid", async () => {
//     const invalidInput = "invalid-url";

//     // Expect the procedure to throw due to schema validation
//     await expect(caller.auth.login(invalidInput)).rejects.toThrowError();

//     // Verify no OIDC client interactions occurred
//     expect(discovery).not.toHaveBeenCalled();
//     expect(buildAuthorizationUrl).not.toHaveBeenCalled();
//   });

//   it("should handle OIDC discovery failure", async () => {
//     const input = "https://redirect.com";

//     // Mock discovery to throw an error
//     vi.spyOn(discovery, "discovery").mockRejectedValueOnce(
//       new Error("Discovery failed")
//     );

//     // Expect the procedure to throw the discovery error
//     await expect(caller.auth.login(input)).rejects.toThrowError(
//       "Discovery failed"
//     );

//     // Verify discovery was called but subsequent steps were not
//     expect(discovery).toHaveBeenCalled();
//     expect(randomState).not.toHaveBeenCalled();
//     expect(buildAuthorizationUrl).not.toHaveBeenCalled();
//   });
// });
