import { RouteSearchTab, routeSearchTabSchema } from "./route";

export const tabNameToIndexMap: Record<RouteSearchTab, number> = {
  [routeSearchTabSchema.enum.environments]: 0,
  [routeSearchTabSchema.enum.applications]: 1,
};
