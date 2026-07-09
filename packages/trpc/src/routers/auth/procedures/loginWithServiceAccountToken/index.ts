import { publicProcedure } from "../../../../procedures/public/index.js";
import { loginWithSATokenInputSchema, loginWithSATokenOutputSchema, resolvePortalRoles } from "@my-project/shared";
import { authenticateServiceAccountToken } from "../../../../utils/authenticateServiceAccountToken/index.js";

export const authLoginWithServiceAccountTokenProcedure = publicProcedure
  .input(loginWithSATokenInputSchema)
  .output(loginWithSATokenOutputSchema)
  .mutation(async ({ input, ctx }) => {
    const { token, redirectSearchParam } = input;

    // Validates the SA token against the cluster (SelfSubjectReview) and builds
    // the session identity + token info. Fully OIDC-independent.
    const { data, secret } = await authenticateServiceAccountToken(token);

    ctx.session.user = { data, authSource: "serviceaccount", secret };

    const clientSearch = redirectSearchParam ? `?redirect=${redirectSearchParam}` : "";

    return {
      success: true,
      userInfo: {
        ...data,
        // SA sessions authenticate but never carry portal roles — authorization for
        // them is the cluster's job (K8s RBAC). Always [] regardless of K8s groups.
        roles: resolvePortalRoles("serviceaccount", data.groups),
      },
      clientSearch,
    };
  });
