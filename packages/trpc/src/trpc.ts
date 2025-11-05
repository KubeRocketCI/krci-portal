import { initTRPC, TRPCError } from "@trpc/server";
import type { TRPCContext } from "./context/types";
import { ERROR_TOKEN_EXPIRED } from "./routers/auth/errors";

export const t = initTRPC.context<TRPCContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Protected procedure - requires authentication
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }

  // Validate token expiration before proceeding
  const idTokenExpiresAt = ctx.session.user.secret.idTokenExpiresAt;
  if (idTokenExpiresAt && Date.now() >= idTokenExpiresAt) {
    throw ERROR_TOKEN_EXPIRED;
  }

  if (!ctx.K8sClient.KubeConfig) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Kubernetes client not initialized",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});
