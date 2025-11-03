import { initTRPC, TRPCError } from "@trpc/server";
import type { TRPCContext } from "./context/types";

export const t = initTRPC.context<TRPCContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Protected procedure - requires authentication
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
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
