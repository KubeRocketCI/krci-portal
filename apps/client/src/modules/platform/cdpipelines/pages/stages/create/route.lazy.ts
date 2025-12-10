import { createLazyRoute } from "@tanstack/react-router";
import CreateStagePage from "./page";

const CreateStageRoute = createLazyRoute("/c/$clusterName/cdpipelines/$namespace/$cdPipeline/stages/create")({
  component: CreateStagePage,
});

export default CreateStageRoute;
