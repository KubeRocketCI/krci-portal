import { RouteSearchTab, routeSearchTabSchema } from "./route";

export const tabNameToIndexMap: Record<RouteSearchTab, number> = {
  [routeSearchTabSchema.enum.overview]: 0,
  [routeSearchTabSchema.enum.yaml]: 1,
  [routeSearchTabSchema.enum.pipelineRuns]: 2,
  [routeSearchTabSchema.enum.diagram]: 3,
};
