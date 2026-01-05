import { RouteSearchTab, routeSearchTabSchema } from "./route";

export const tabNameToIndexMap: Record<RouteSearchTab, number> = {
  [routeSearchTabSchema.enum.live]: 0,
  [routeSearchTabSchema.enum["tekton-results"]]: 1,
};
