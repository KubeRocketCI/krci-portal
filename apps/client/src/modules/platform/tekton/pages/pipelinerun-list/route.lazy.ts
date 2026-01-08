import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_PIPELINERUNS } from "./route";
import { PipelineRunListPage } from "./page";

export const Route = createLazyRoute(ROUTE_ID_PIPELINERUNS)({
  component: PipelineRunListPage,
});
