import { RouteSearchTab, routeSearchTabSchema } from "./route";

export const tabNameToIndexMap: Record<RouteSearchTab, number> = {
  [routeSearchTabSchema.enum.overview]: 0,
  [routeSearchTabSchema.enum.branches]: 1,
  [routeSearchTabSchema.enum.pipelines]: 2,
  [routeSearchTabSchema.enum.code]: 3,
  [routeSearchTabSchema.enum.deployments]: 4,
};

export const indexToTabNameMap: Record<number, RouteSearchTab> = {
  0: routeSearchTabSchema.enum.overview,
  1: routeSearchTabSchema.enum.branches,
  2: routeSearchTabSchema.enum.pipelines,
  3: routeSearchTabSchema.enum.code,
  4: routeSearchTabSchema.enum.deployments,
};
