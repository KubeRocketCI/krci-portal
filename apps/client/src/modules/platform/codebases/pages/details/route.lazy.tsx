import { createLazyRoute } from "@tanstack/react-router";
import ComponentDetailsPage from "./view";

const ComponentDetailsRoute = createLazyRoute("/c/$clusterName/components/$namespace/$name")({
  component: ComponentDetailsPage,
});

export default ComponentDetailsRoute;
