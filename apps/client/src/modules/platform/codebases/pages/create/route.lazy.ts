import { createLazyRoute } from "@tanstack/react-router";
import CreateCodebasePage from "./page";

const CreateCodebaseRoute = createLazyRoute("/c/$clusterName/components/create")({
  component: CreateCodebasePage,
});

export default CreateCodebaseRoute;
