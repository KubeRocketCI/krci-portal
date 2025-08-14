import { RouteSearchTab, routeSearchTabName } from "./route";

export const tabNameToIndexMap: Record<RouteSearchTab, number> = {
  [routeSearchTabName.overview]: 0,
  [routeSearchTabName.yaml]: 1,
};
