import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_CODEBASE_CREATE } from "./route";
import CreateCodebasePage from "./page";

const CreateCodebaseRoute = createLazyRoute(ROUTE_ID_CODEBASE_CREATE)({
  component: CreateCodebasePage,
});

export default CreateCodebaseRoute;
