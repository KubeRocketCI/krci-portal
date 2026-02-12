import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_PROJECT_CREATE } from "./route";
import CreateCodebasePage from "./page";

const CreateProjectRoute = createLazyRoute(ROUTE_ID_PROJECT_CREATE)({
  component: CreateCodebasePage,
});

export default CreateProjectRoute;
