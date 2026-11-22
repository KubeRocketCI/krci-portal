import { RouteSearchTab, routeSearchTabSchema } from "./route";

// Indices must match the tab order in usePageTabs.
export const tabNameToIndexMap: Record<RouteSearchTab, number> = {
  [routeSearchTabSchema.enum.overview]: 0,
  [routeSearchTabSchema.enum.branches]: 1,
  [routeSearchTabSchema.enum.pipelines]: 2,
  [routeSearchTabSchema.enum.security]: 3,
  [routeSearchTabSchema.enum.vulnerabilities]: 4,
  [routeSearchTabSchema.enum.findings]: 5,
  [routeSearchTabSchema.enum.code]: 6,
  [routeSearchTabSchema.enum.deployments]: 7,
};
