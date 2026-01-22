import { createRouter } from "@tanstack/react-router";
import { LoadingProgressBar } from "../components/ui/LoadingProgressBar";
import { RouterErrorComponent } from "./components/RouterErrorComponent";
import { routeHome } from "../../modules/home/pages/home/route";
import { routeComponentList } from "../../modules/platform/codebases/pages/list/route";
import { routeCodebaseCreate } from "../../modules/platform/codebases/pages/create/route";
import { routeAuthCallback } from "../auth/pages/callback/route";
import { routeAuthLogin } from "../auth/pages/login/route";
import ContentLayout from "../components/PageLayout";
import { rootRoute } from "./_root";
import { routeComponentDetails } from "../../modules/platform/codebases/pages/details/route";
import {
  authRoute,
  contentLayoutRoute,
  indexRoute,
  routeCluster,
  routeCICD,
  routeObservability,
  routeSecurity,
  routeConfiguration,
} from "./routes";
import { routeCDPipelineList } from "@/modules/platform/cdpipelines/pages/list/route";
import { routeCDPipelineCreate } from "@/modules/platform/cdpipelines/pages/create/route";

// Assign the ContentLayout component here to avoid circular dependency
contentLayoutRoute.update({
  component: ContentLayout,
});

export {
  authRoute,
  contentLayoutRoute,
  indexRoute,
  routeCluster,
  routeCICD,
  routeObservability,
  routeSecurity,
  routeConfiguration,
};
import { routeCDPipelineDetails } from "@/modules/platform/cdpipelines/pages/details/route";
import { routePipelineDetails } from "@/modules/platform/tekton/pages/pipeline-details/route";
import { routePipelineList } from "@/modules/platform/tekton/pages/pipeline-list/route";
import { routePipelineRunList } from "@/modules/platform/tekton/pages/pipelinerun-list/route";
import { routePipelineRunDetails } from "@/modules/platform/tekton/pages/pipelinerun-details/route";
import { routeTektonResultPipelineRunDetails } from "@/modules/platform/tekton/pages/tekton-result-details/route";
import { routeOverviewDetails } from "@/modules/platform/overview/pages/details/route";
import { routeArgocdConfiguration } from "@/modules/platform/configuration/modules/argocd/route";
import { routeChatAssistantConfiguration } from "@/modules/platform/configuration/modules/chat-assistant/route";
import { routeClustersConfiguration } from "@/modules/platform/configuration/modules/clusters/route";
import { routeCodemieConfiguration } from "@/modules/platform/configuration/modules/codemie/route";
import { routeDefectdojoConfiguration } from "@/modules/platform/configuration/modules/defectdojo/route";
import { routeDependencyTrackConfiguration } from "@/modules/platform/configuration/modules/dependency-track/route";
import { routeGitopsConfiguration } from "@/modules/platform/configuration/modules/gitops/route";
import { routeGitserversConfiguration } from "@/modules/platform/configuration/modules/gitservers/route";
import { routeJiraConfiguration } from "@/modules/platform/configuration/modules/jira/route";
import { routeNexusConfiguration } from "@/modules/platform/configuration/modules/nexus/route";
import { routeQuicklinksConfiguration } from "@/modules/platform/configuration/modules/quicklinks/route";
import { routeRegistryConfiguration } from "@/modules/platform/configuration/modules/registry/route";
import { routeSonarConfiguration } from "@/modules/platform/configuration/modules/sonar/route";
import { routeStageDetails } from "@/modules/platform/cdpipelines/pages/stage-details/route";
import { routeStageCreate } from "@/modules/platform/cdpipelines/pages/stages/create/route";
import { routeTaskList } from "@/modules/platform/tekton/pages/task-list/route";
import { routeTaskDetails } from "@/modules/platform/tekton/pages/task-details/route";
import { routePipelineMetrics } from "@/modules/platform/observability/pages/pipeline-metrics/route";
import { routeSCA } from "@/modules/platform/security/pages/sca/route";
import { routeSCAProjects } from "@/modules/platform/security/pages/sca-projects/route";
import { routeSCAProjectDetails } from "@/modules/platform/security/pages/sca-project-details/route";
import { routeSAST } from "@/modules/platform/security/pages/sast/route";
import { routeSASTProjectDetails } from "@/modules/platform/security/pages/sast-project-details/route";

const routeTree = rootRoute.addChildren([
  authRoute.addChildren([routeAuthLogin, routeAuthCallback]),
  contentLayoutRoute.addChildren([
    indexRoute,
    routeHome,
    routeCluster.addChildren([
      routeOverviewDetails,
      routeComponentList,
      routeCodebaseCreate,
      routeComponentDetails,
      routeCDPipelineList,
      routeCDPipelineCreate,
      routeCDPipelineDetails,
      routeStageDetails,
      routeStageCreate,
      routeCICD.addChildren([
        routePipelineList,
        routePipelineDetails,
        routeTaskList,
        routeTaskDetails,
        routePipelineRunList,
        routePipelineRunDetails,
        routeTektonResultPipelineRunDetails,
      ]),
      routeObservability.addChildren([routePipelineMetrics]),
      routeSecurity.addChildren([
        routeSCA,
        routeSCAProjects,
        routeSCAProjectDetails,
        routeSAST,
        routeSASTProjectDetails,
      ]),
      routeConfiguration.addChildren([
        routeArgocdConfiguration,
        routeChatAssistantConfiguration,
        routeClustersConfiguration,
        routeCodemieConfiguration,
        routeDefectdojoConfiguration,
        routeDependencyTrackConfiguration,
        routeGitopsConfiguration,
        routeGitserversConfiguration,
        routeJiraConfiguration,
        routeNexusConfiguration,
        routeQuicklinksConfiguration,
        routeRegistryConfiguration,
        routeSonarConfiguration,
      ]),
    ]),
  ]),
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultStaleTime: 5000,
  scrollRestoration: true,
  defaultPreloadStaleTime: 0,
  defaultPendingComponent: LoadingProgressBar,
  defaultErrorComponent: RouterErrorComponent,
  context: {
    queryClient: undefined!,
  },
});
