import { TRPCError } from "@trpc/server";
import type { TRPCContext } from "../../../../context/types.js";

/**
 * `protectedProcedure` guarantees a session user at runtime but doesn't
 * narrow the type, so the optional-chain + throw is centralized here for
 * every notifications procedure that scopes reads/writes by `sub`.
 */
export function getUserSub(ctx: TRPCContext): string {
  const sub = ctx.session.user?.data?.sub;

  if (!sub) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "No session found.",
    });
  }

  return sub;
}
