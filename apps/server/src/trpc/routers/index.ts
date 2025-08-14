import { t } from "..";
import { authRouter } from "./auth";
import { k8sRouter } from "./k8s";
import { krakendRouter } from "./krakend";

export const appRouter = t.router({
  auth: authRouter,
  k8s: k8sRouter,
  krakend: krakendRouter,
});

export const createCaller = t.createCallerFactory(appRouter);
