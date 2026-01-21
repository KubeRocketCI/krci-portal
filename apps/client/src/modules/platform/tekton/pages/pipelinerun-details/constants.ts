import { RouteSearchTab, routeSearchTabSchema } from "./route";

export const tabNameToIndexMap: Record<RouteSearchTab, number> = {
  [routeSearchTabSchema.enum.details]: 0,
  [routeSearchTabSchema.enum.yaml]: 1,
  [routeSearchTabSchema.enum.results]: 2,
  [routeSearchTabSchema.enum.diagram]: 3,
};
