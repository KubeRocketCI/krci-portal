import { createLazyRoute } from "@tanstack/react-router";
import ComponentListPage from "./page";

const ComponentListRoute = createLazyRoute("/c/$clusterName/components")({
  component: ComponentListPage,
});

export default ComponentListRoute;
