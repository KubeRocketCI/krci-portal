import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_PROJECT_DETAILS } from "./route";
import ComponentDetailsPage from "./page";

const ProjectDetailsRoute = createLazyRoute(ROUTE_ID_PROJECT_DETAILS)({
  component: ComponentDetailsPage,
});

export default ProjectDetailsRoute;
