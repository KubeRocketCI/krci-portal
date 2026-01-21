import { RouteSearchTab, routeSearchTabSchema } from "./route";

export const tabNameToIndexMap: Record<RouteSearchTab, number> = {
  [routeSearchTabSchema.enum.logs]: 0,
  [routeSearchTabSchema.enum.yaml]: 1,
};
