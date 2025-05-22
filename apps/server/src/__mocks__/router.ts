import { t } from "@/trpc";
import { protectedProcedure } from "@/trpc/procedures/protected";

// This router is used to test the protected and public procedures in isolation.
// It is not used in the app itself.

export const testRouter = t.router({
  testProtected: protectedProcedure.query(() => {
    return true;
  }),
  testPublic: t.procedure.query(() => {
    return true;
  }),
});

export type TestRouter = typeof testRouter;
export const createTestRouterCaller = t.createCallerFactory(testRouter);
