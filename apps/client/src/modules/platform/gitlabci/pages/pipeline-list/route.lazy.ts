import { createLazyRoute } from "@tanstack/react-router";
import { ROUTE_ID_GITLABCI_PIPELINES } from "./route";
import { GitLabCIPipelineListPage } from "./page";

const GitLabCIPipelineListRoute = createLazyRoute(ROUTE_ID_GITLABCI_PIPELINES)({
  component: GitLabCIPipelineListPage,
});

export default GitLabCIPipelineListRoute;
