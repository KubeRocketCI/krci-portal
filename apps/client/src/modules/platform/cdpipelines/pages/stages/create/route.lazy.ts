import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_STAGE_CREATE } from "./route";
import CreateStagePage from "./page";

const CreateStageRoute = createLazyRoute(ROUTE_ID_STAGE_CREATE)({
  component: CreateStagePage,
});

export default CreateStageRoute;
