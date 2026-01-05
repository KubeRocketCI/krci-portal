import { RouteSearchTab, routeSearchTabSchema } from "./route";

export const tabNameToIndexMap: Record<RouteSearchTab, number> = {
  [routeSearchTabSchema.enum.overview]: 0,
  [routeSearchTabSchema.enum.details]: 1,
  [routeSearchTabSchema.enum.yaml]: 2,
  [routeSearchTabSchema.enum.results]: 3,
  [routeSearchTabSchema.enum.diagram]: 4,
};
