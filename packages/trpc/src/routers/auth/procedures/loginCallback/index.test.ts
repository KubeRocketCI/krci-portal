// import { describe, it, expect, vi, beforeEach } from "vitest";
// import { createMockedContext } from "@/__mocks__/context";
// import { createCaller } from "@/trpc/routers";
// import { authorizationCodeGrant, fetchProtectedResource } from "openid-client";
// import { mockSession } from "@/__mocks__/session";

// describe("authLoginCallbackProcedure", () => {
//   let mockContext: ReturnType<typeof createMockedContext>;
//   let caller: ReturnType<typeof createCaller>;

//   beforeEach(() => {
//     // Create mocked context
//     mockContext = createMockedContext();

//     // Reset mocks
//     vi.clearAllMocks();

//     // Create caller with mocked context
//     caller = createCaller(mockContext);

//     // Set up default session state
//     mockContext.session.login = {
//       openId: {
//         state: "random-state",
//         codeVerifier: "verifier123",
//       },
//       clientSearch: "?param=test",
//     };
//   });

//   it("should process callback and return user info", async () => {
//     const input = "https://redirect.com?code=abc123&state=random-state";

//     // Call the procedure
//     const result = await caller.auth.loginCallback(input);

//     // Verify the result
//     expect(result).toEqual({
//       success: true,
//       userInfo: mockSession.user.data,
//       clientSearch: "?param=test",
//     });

//     // Verify session updates
//     expect(mockContext.session.user).toEqual({
//       data: mockSession.user.data,
//       secret: {
//         idToken: "id-token",
//         idTokenExpiresAt: 1234567890,
//         accessToken: "access-token",
//         accessTokenExpiresAt: 1234567890,
//         refreshToken: "refresh-token",
//       },
//     });
//     expect(mockContext.session.login).toBeUndefined();

//     // Verify OIDC client interactions
//     expect(authorizationCodeGrant).toHaveBeenCalledWith(
//       expect.anything(),
//       expect.any(URL),
//       {
//         pkceCodeVerifier: "verifier123",
//         expectedState: "random-state",
//       }
//     );
//     expect(fetchProtectedResource).toHaveBeenCalledWith(
//       expect.anything(),
//       "access-token",
//       expect.any(URL),
//       "GET"
//     );
//   });

//   it("should throw error if session.login is undefined", async () => {
//     mockContext.session.login = undefined;
//     const input = "https://redirect.com?code=abc123&state=random-state";

//     // Expect the procedure to throw
//     await expect(caller.auth.loginCallback(input)).rejects.toThrowError(
//       "Session Auth is undefined"
//     );

//     // Verify no OIDC client interactions occurred
//     expect(authorizationCodeGrant).not.toHaveBeenCalled();
//     expect(fetchProtectedResource).not.toHaveBeenCalled();
//   });

//   it("should throw error if state is invalid", async () => {
//     const input = "https://redirect.com?code=abc123&state=wrong-state";

//     // Expect the procedure to throw
//     await expect(caller.auth.loginCallback(input)).rejects.toThrowError(
//       "Invalid state"
//     );

//     // Verify no OIDC client interactions occurred
//     expect(authorizationCodeGrant).not.toHaveBeenCalled();
//     expect(fetchProtectedResource).not.toHaveBeenCalled();
//   });

//   it("should handle token exchange failure", async () => {
//     const input = "https://redirect.com?code=abc123&state=random-state";

//     // Mock token exchange to throw an error
//     vi.spyOn(authorizationCodeGrant, "authorizationCodeGrant").mockRejectedValueOnce(
//       new Error("Token exchange failed")
//     );

//     // Expect the procedure to throw the token exchange error
//     await expect(caller.auth.loginCallback(input)).rejects.toThrowError(
//       "Token exchange failed"
//     );

//     // Verify token exchange was called but user info fetch was not
//     expect(authorizationCodeGrant).toHaveBeenCalled();
//     expect(fetchProtectedResource).not.toHaveBeenCalled();
//   });

//   it("should handle user info fetch failure", async () => {
//     const input = "https://redirect.com?code=abc123&state=random-state";

//     // Mock user info fetch to throw an error
//     vi.spyOn(fetchProtectedResource, "fetchProtectedResource").mockRejectedValueOnce(
//       new Error("User info fetch failed")
//     );

//     // Expect the procedure to throw the user info fetch error
//     await expect(caller.auth.loginCallback(input)).rejects.toThrowError(
//       "User info fetch failed"
//     );

//     // Verify both token exchange and user info fetch were called
//     expect(openIdClient.authorizationCodeGrant).toHaveBeenCalled();
//     expect(openIdClient.fetchProtectedResource).toHaveBeenCalled();
//   });
// });
