import { t } from "../../trpc";
import { ERROR_NO_SESSION_FOUND, ERROR_TOKEN_EXPIRED } from "../../routers/auth/errors";
import { TRPCError } from "@trpc/server";

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const { session } = ctx;

  const sessionUser = session.user;

  if (!sessionUser) {
    throw new TRPCError(ERROR_NO_SESSION_FOUND);
  }

  const idTokenExpiresAt = sessionUser.secret.idTokenExpiresAt;
  if (idTokenExpiresAt && Date.now() >= idTokenExpiresAt) {
    throw new TRPCError(ERROR_TOKEN_EXPIRED);
  }

  return next();
});
