export const mockSession = {
  cookie: {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    originalMaxAge: 86400000, // 24 hours in ms
    sameSite: "lax",
    secure: false,
    path: "/",
    httpOnly: true,
    domain: undefined,
  },
  user: {
    data: {
      sub: "3705dd06-7992-44aa-85ac-d35e664e87d5",
      email_verified: false,
      name: "John Doe",
      groups: ["group-1", "group-2"],
      preferred_username: "john_doe@world.com",
      default_namespace: "test-namespace",
      given_name: "John",
      family_name: "Doe",
      email: "john_doe@world.com",
      picture: "test-picture",
    },
    secret: {
      accessToken: "mockAccessToken",
      accessTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
      idToken: "mockIdToken",
      idTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
      refreshToken: "mockRefreshToken",
    },
  },
  sessionId: "mock-session-id",
};
