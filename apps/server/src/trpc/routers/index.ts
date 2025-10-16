import { t } from "..";
import { authRouter } from "./auth";
import { configRouter } from "./config";
import { k8sRouter } from "./k8s";
import { krakendRouter } from "./krakend";

export const appRouter = t.router({
  auth: authRouter,
  config: configRouter,
  k8s: k8sRouter,
  krakend: krakendRouter,
});

export const createCaller = t.createCallerFactory(appRouter);
