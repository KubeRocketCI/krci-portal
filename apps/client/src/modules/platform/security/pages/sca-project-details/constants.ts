import { RouteSearchTab, routeSearchTabSchema } from "./route";

export const tabNameToIndexMap: Record<RouteSearchTab, number> = {
  [routeSearchTabSchema.enum.overview]: 0,
  [routeSearchTabSchema.enum.components]: 1,
  [routeSearchTabSchema.enum.services]: 2,
  [routeSearchTabSchema.enum.dependencies]: 3,
  [routeSearchTabSchema.enum.vulnerabilities]: 4,
  [routeSearchTabSchema.enum.epss]: 5,
  [routeSearchTabSchema.enum.violations]: 6,
};
