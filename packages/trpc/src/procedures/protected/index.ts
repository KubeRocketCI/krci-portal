import { t } from "../../trpc";
import { ERROR_NO_SESSION_FOUND } from "../../routers/auth/errors";
import { TRPCError } from "@trpc/server";

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const { session } = ctx;

  const sessionUser = session.user;

  if (!sessionUser) {
    throw new TRPCError(ERROR_NO_SESSION_FOUND);
  }

  return next();
});
