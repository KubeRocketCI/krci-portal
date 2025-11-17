import { publicProcedure } from "../../../../procedures/public/index.js";
import { loginWithTokenInputSchema, loginWithTokenOutputSchema } from "@my-project/shared";
import { OIDCClient } from "../../../../clients/oidc/index.js";
import { TRPCError } from "@trpc/server";

export const authLoginWithTokenProcedure = publicProcedure
  .input(loginWithTokenInputSchema)
  .output(loginWithTokenOutputSchema)
  .mutation(async ({ input, ctx }) => {
    const { token, redirectSearchParam } = input;
    const oidcClient = new OIDCClient(ctx.oidcConfig);
    const config = await oidcClient.discover();

    try {
      // Validate token and get user info
      const userInfo = await oidcClient.validateTokenAndGetUserInfo(config, token);

      // Get token information (expiration, etc.)
      const tokenInfo = oidcClient.validateTokenAndGetTokenInfo(token);

      // Create session similar to loginCallback
      ctx.session.user = {
        data: userInfo,
        secret: {
          idToken: tokenInfo.idToken,
          idTokenExpiresAt: tokenInfo.idTokenExpiresAt,
          accessToken: tokenInfo.accessToken,
          accessTokenExpiresAt: tokenInfo.accessTokenExpiresAt,
          refreshToken: tokenInfo.refreshToken || "", // May not be available
        },
      };

      const clientSearch = redirectSearchParam ? `?redirect=${redirectSearchParam}` : "";

      return {
        success: true,
        userInfo: userInfo
          ? {
              ...userInfo,
              issuerUrl: ctx.oidcConfig.issuerURL || undefined,
            }
          : undefined,
        clientSearch,
      };
    } catch (error) {
      // Token validation failed
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: `Token validation failed: ${(error as Error)?.message || "Unknown error"}. Please check your token and try again.`,
      });
    }
  });
