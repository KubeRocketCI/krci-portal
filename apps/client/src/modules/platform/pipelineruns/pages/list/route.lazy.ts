import { createLazyRoute } from "@tanstack/react-router";
import { PipelineRunListPage } from "./page";

export const Route = createLazyRoute("/c/$clusterName/cicd/pipelineruns")({
  component: PipelineRunListPage,
});
