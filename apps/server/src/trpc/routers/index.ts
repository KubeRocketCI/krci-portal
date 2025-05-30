import { t } from "..";
import { authRouter } from "./auth";
import { k8sRouter } from "./k8s";

export const appRouter = t.router({
  auth: authRouter,
  k8s: k8sRouter,
});

export const createCaller = t.createCallerFactory(appRouter);
