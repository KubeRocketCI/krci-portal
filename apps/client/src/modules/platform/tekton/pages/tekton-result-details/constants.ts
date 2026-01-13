import { RouteSearchTab, routeSearchTabSchema } from "./route";

export const tabNameToIndexMap: Record<RouteSearchTab, number> = {
  [routeSearchTabSchema.enum.overview]: 0,
  [routeSearchTabSchema.enum.logs]: 1,
  [routeSearchTabSchema.enum.yaml]: 2,
};
