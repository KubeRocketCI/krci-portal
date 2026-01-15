import type { inferRouterOutputs, inferRouterInputs } from "@trpc/server";
import { t } from "../trpc.js";
import { authRouter } from "./auth/index.js";
import { configRouter } from "./config/index.js";
import { dependencyTrackRouter } from "./dependencyTrack/index.js";
import { gitfusionRouter } from "./gitfusion/index.js";
import { k8sRouter } from "./k8s/index.js";
import { sonarqubeRouter } from "./sonarqube/index.js";
import { tektonResultsRouter } from "./tektonResults/index.js";

export const appRouter = t.router({
  auth: authRouter,
  config: configRouter,
  dependencyTrack: dependencyTrackRouter,
  gitfusion: gitfusionRouter,
  k8s: k8sRouter,
  sonarqube: sonarqubeRouter,
  tektonResults: tektonResultsRouter,
});

export const createCaller = t.createCallerFactory(appRouter);

export type AppRouter = typeof appRouter;
export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;
