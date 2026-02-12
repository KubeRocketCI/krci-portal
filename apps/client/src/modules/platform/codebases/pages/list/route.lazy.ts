import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_PROJECTS } from "./route";
import ComponentListPage from "./page";

const ProjectListRoute = createLazyRoute(ROUTE_ID_PROJECTS)({
  component: ComponentListPage,
});

export default ProjectListRoute;
