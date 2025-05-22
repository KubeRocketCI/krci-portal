import { createLazyRoute } from "@tanstack/react-router";
import ComponentListPage from "./view";

const ComponentListRoute = createLazyRoute("/c/$clusterName/components")({
  component: ComponentListPage,
});

export default ComponentListRoute;
