import { publicProcedure } from "../../../../procedures/public/index.js";
import { loginWithSATokenInputSchema, loginWithSATokenOutputSchema } from "@my-project/shared";
import { authenticateServiceAccountToken } from "../../../../utils/authenticateServiceAccountToken/index.js";

export const authLoginWithServiceAccountTokenProcedure = publicProcedure
  .input(loginWithSATokenInputSchema)
  .output(loginWithSATokenOutputSchema)
  .mutation(async ({ input, ctx }) => {
    const { token, redirectSearchParam } = input;

    // Validates the SA token against the cluster (SelfSubjectReview) and builds
    // the session identity + token info. Fully OIDC-independent.
    const { data, secret } = await authenticateServiceAccountToken(token);

    ctx.session.user = { data, secret };

    const clientSearch = redirectSearchParam ? `?redirect=${redirectSearchParam}` : "";

    return {
      success: true,
      userInfo: data,
      clientSearch,
    };
  });
