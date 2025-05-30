import { createLazyRoute } from "@tanstack/react-router";
import ComponentDetailsPage from "./page";

const ComponentDetailsRoute = createLazyRoute("/c/$clusterName/components/$namespace/$name")({
  component: ComponentDetailsPage,
});

export default ComponentDetailsRoute;
