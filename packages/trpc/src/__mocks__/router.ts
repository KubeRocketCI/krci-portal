// This router is used to test the protected and public procedures in isolation.
// It is not used in the app itself.

import { t } from "../trpc.js";
import { protectedProcedure } from "../procedures/protected/index.js";

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
