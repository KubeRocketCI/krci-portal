import { routeSecurity } from "@/core/router/routes";
import { createRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  pageSearchParam,
  platformListSearchParams,
} from "@/modules/platform/security/components/defectdojo/searchParams";

/** "container/exposed-secrets": pinned items and links store this path. */
export const PATH_EXPOSED_SECRETS = "container/exposed-secrets" as const;
export const PATH_EXPOSED_SECRETS_FULL = "/c/$clusterName/security/container/exposed-secrets" as const;
export const ROUTE_ID_EXPOSED_SECRETS = "/_layout/c/$clusterName/security/container/exposed-secrets" as const;

export const exposedSecretsSearchSchema = z.object({
  ...platformListSearchParams,
  codePage: pageSearchParam,
  runtimePage: pageSearchParam,
});

export type Search = z.infer<typeof exposedSecretsSearchSchema>;

export const routeExposedSecrets = createRoute({
  getParentRoute: () => routeSecurity,
  path: PATH_EXPOSED_SECRETS,
  validateSearch: (search: Record<string, unknown>): Search => exposedSecretsSearchSchema.parse(search),
  head: () => ({
    meta: [{ title: "Exposed Secrets | KRCI" }],
  }),
}).lazy(() => import("./route.lazy").then((res) => res.default));
