import { createRouter } from "@tanstack/react-router";
import { LoadingProgressBar } from "../components/ui/LoadingProgressBar";
import { RouterErrorComponent } from "./components/RouterErrorComponent";
import { routeHome } from "../../modules/home/pages/home/route";
import { routeProjectList } from "../../modules/platform/codebases/pages/list/route";
import { routeProjectCreate } from "../../modules/platform/codebases/pages/create/route";
import { routeAuthCallback } from "../auth/pages/callback/route";
import { routeAuthLogin } from "../auth/pages/login/route";
import ContentLayout from "../components/PageLayout";
import { rootRoute } from "./_root";
import { routeProjectDetails } from "../../modules/platform/codebases/pages/details/route";
import {
  authRoute,
  contentLayoutRoute,
  indexRoute,
  routeCluster,
  routeCICD,
  routeObservability,
  routeSecurity,
  routeConfiguration,
  routeK8sMode,
} from "./routes";
import { routeK8sOverview } from "@/modules/k8s/pages/overview/route";
import { routeK8sList } from "@/modules/k8s/pages/list/route";
import { routeK8sDetailNamespaced } from "@/modules/k8s/pages/detail-namespaced/route";
import { routeK8sDetailCluster } from "@/modules/k8s/pages/detail-cluster/route";
import { routeK8sCRDsDetail } from "@/modules/k8s/pages/crds/detail/route";
import { routeK8sCRParent } from "@/modules/k8s/pages/custom-resources/cr-parent/route";
import { routeK8sCRList } from "@/modules/k8s/pages/custom-resources/list/route";
import { routeK8sCRDetailNs } from "@/modules/k8s/pages/custom-resources/detail-namespaced/route";
import { routeK8sCRDetailCluster } from "@/modules/k8s/pages/custom-resources/detail-cluster/route";
import { routeK8sPodsList } from "@/modules/k8s/pages/pods/list/route";
import { routeK8sPodDetail } from "@/modules/k8s/pages/pods/detail/route";
import { routeK8sNodesList } from "@/modules/k8s/pages/nodes/list/route";
import { routeK8sNodeDetail } from "@/modules/k8s/pages/nodes/detail/route";
import { routeK8sEvents } from "@/modules/k8s/pages/events/route";
import { routeK8sRbacOverview } from "@/modules/k8s/pages/rbac/route";
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
  routeK8sMode,
};
import { routeCDPipelineDetails } from "@/modules/platform/cdpipelines/pages/details/route";
import { routePipelineDetails } from "@/modules/platform/tekton/pages/pipeline-details/route";
import { routePipelineList } from "@/modules/platform/tekton/pages/pipeline-list/route";
import { routePipelineRunList } from "@/modules/platform/tekton/pages/pipelinerun-list/route";
import { routePipelineRunDetails } from "@/modules/platform/tekton/pages/pipelinerun-details/route";
import { routeGitLabCIPipelineList } from "@/modules/platform/gitlabci/pages/pipeline-list/route";
import { routeOverviewDetails } from "@/modules/platform/overview/pages/details/route";
import { routeArgocdConfiguration } from "@/modules/platform/configuration/modules/argocd/route";
import { routeClustersConfiguration } from "@/modules/platform/configuration/modules/clusters/route";
import { routeDefectdojoConfiguration } from "@/modules/platform/configuration/modules/defectdojo/route";
import { routeDependencyTrackConfiguration } from "@/modules/platform/configuration/modules/dependency-track/route";
import { routeGitopsConfiguration } from "@/modules/platform/configuration/modules/gitops/route";
import { routeGitserversConfiguration } from "@/modules/platform/configuration/modules/gitservers/route";
import { routeJiraConfiguration } from "@/modules/platform/configuration/modules/jira/route";
import { routeNexusConfiguration } from "@/modules/platform/configuration/modules/nexus/route";
import { routeQuicklinksConfiguration } from "@/modules/platform/configuration/modules/quicklinks/route";
import { routeRegistryConfiguration } from "@/modules/platform/configuration/modules/registry/route";
import { routeSonarConfiguration } from "@/modules/platform/configuration/modules/sonar/route";
import { routeSettingsTours } from "@/modules/tours/pages/settings/route";
import { routeStageDetails } from "@/modules/platform/cdpipelines/pages/stage-details/route";
import { routeStageCreate } from "@/modules/platform/cdpipelines/pages/stages/create/route";
import { routeTaskList } from "@/modules/platform/tekton/pages/task-list/route";
import { routeTaskDetails } from "@/modules/platform/tekton/pages/task-details/route";
import { routeEventListenerList } from "@/modules/platform/tekton/pages/event-listener-list/route";
import { routeEventListenerDetails } from "@/modules/platform/tekton/pages/event-listener-details/route";
import { routeTriggerList } from "@/modules/platform/tekton/pages/trigger-list/route";
import { routeTriggerDetails } from "@/modules/platform/tekton/pages/trigger-details/route";
import { routeTriggerTemplateList } from "@/modules/platform/tekton/pages/trigger-template-list/route";
import { routeTriggerTemplateDetails } from "@/modules/platform/tekton/pages/trigger-template-details/route";
import { routeTriggerBindingList } from "@/modules/platform/tekton/pages/trigger-binding-list/route";
import { routeTriggerBindingDetails } from "@/modules/platform/tekton/pages/trigger-binding-details/route";
import { routeInterceptorList } from "@/modules/platform/tekton/pages/interceptor-list/route";
import { routeInterceptorDetails } from "@/modules/platform/tekton/pages/interceptor-details/route";
import { routeClusterInterceptorList } from "@/modules/platform/tekton/pages/cluster-interceptor-list/route";
import { routeClusterInterceptorDetails } from "@/modules/platform/tekton/pages/cluster-interceptor-details/route";
import { routePipelineMetrics } from "@/modules/platform/observability/pages/pipeline-metrics/route";
import { routeSCA } from "@/modules/platform/security/pages/sca/route";
import { routeSCAProjects } from "@/modules/platform/security/pages/sca-projects/route";
import { routeSCAProjectDetails } from "@/modules/platform/security/pages/sca-project-details/route";
import { routeSAST } from "@/modules/platform/security/pages/sast/route";
import { routeSASTProjectDetails } from "@/modules/platform/security/pages/sast-project-details/route";
import { routeTrivyVulnerabilities } from "@/modules/platform/security/pages/trivy-vulnerabilities/route";
import { routeTrivyVulnerabilityDetails } from "@/modules/platform/security/pages/trivy-vulnerability-details/route";
import { routeTrivyOverview } from "@/modules/platform/security/pages/trivy-overview/route";
import { routeTrivyConfigAudits } from "@/modules/platform/security/pages/trivy-config-audits/route";
import { routeTrivyConfigAuditDetails } from "@/modules/platform/security/pages/trivy-config-audit-details/route";
import { routeTrivyCompliance } from "@/modules/platform/security/pages/trivy-compliance/route";
import { routeTrivyComplianceDetails } from "@/modules/platform/security/pages/trivy-compliance-details/route";
import { routeTrivyExposedSecrets } from "@/modules/platform/security/pages/trivy-exposed-secrets/route";
import { routeTrivyExposedSecretDetails } from "@/modules/platform/security/pages/trivy-exposed-secret-details/route";
import { routeTrivyRbacAssessments } from "@/modules/platform/security/pages/trivy-rbac-assessments/route";
import { routeTrivyRbacAssessmentDetails } from "@/modules/platform/security/pages/trivy-rbac-assessment-details/route";
import { routeTrivyClusterRbacAssessments } from "@/modules/platform/security/pages/trivy-cluster-rbac-assessments/route";
import { routeTrivyClusterRbacAssessmentDetails } from "@/modules/platform/security/pages/trivy-cluster-rbac-assessment-details/route";
import { routeTrivyInfraAssessments } from "@/modules/platform/security/pages/trivy-infra-assessments/route";
import { routeTrivyInfraAssessmentDetails } from "@/modules/platform/security/pages/trivy-infra-assessment-details/route";
import { routeTrivyClusterInfraAssessments } from "@/modules/platform/security/pages/trivy-cluster-infra-assessments/route";
import { routeTrivyClusterInfraAssessmentDetails } from "@/modules/platform/security/pages/trivy-cluster-infra-assessment-details/route";
import { routeTrivyClusterConfigAudits } from "@/modules/platform/security/pages/trivy-cluster-config-audits/route";
import { routeTrivyClusterConfigAuditDetails } from "@/modules/platform/security/pages/trivy-cluster-config-audit-details/route";
import { routeTrivyClusterVulnerabilities } from "@/modules/platform/security/pages/trivy-cluster-vulnerabilities/route";
import { routeTrivyClusterVulnerabilityDetails } from "@/modules/platform/security/pages/trivy-cluster-vulnerability-details/route";

const routeTree = rootRoute.addChildren([
  authRoute.addChildren([routeAuthLogin, routeAuthCallback]),
  contentLayoutRoute.addChildren([
    indexRoute,
    routeHome,
    routeSettingsTours,
    routeCluster.addChildren([
      routeOverviewDetails,
      routeProjectList,
      routeProjectCreate,
      routeProjectDetails,
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
        routeGitLabCIPipelineList,
      ]),
      routeObservability.addChildren([routePipelineMetrics]),
      routeSecurity.addChildren([
        routeSCA,
        routeSCAProjects,
        routeSCAProjectDetails,
        routeSAST,
        routeSASTProjectDetails,
        routeTrivyOverview,
        routeTrivyVulnerabilities,
        routeTrivyVulnerabilityDetails,
        routeTrivyConfigAudits,
        routeTrivyConfigAuditDetails,
        routeTrivyCompliance,
        routeTrivyComplianceDetails,
        routeTrivyExposedSecrets,
        routeTrivyExposedSecretDetails,
        routeTrivyRbacAssessments,
        routeTrivyRbacAssessmentDetails,
        routeTrivyClusterRbacAssessments,
        routeTrivyClusterRbacAssessmentDetails,
        routeTrivyInfraAssessments,
        routeTrivyInfraAssessmentDetails,
        routeTrivyClusterInfraAssessments,
        routeTrivyClusterInfraAssessmentDetails,
        routeTrivyClusterConfigAudits,
        routeTrivyClusterConfigAuditDetails,
        routeTrivyClusterVulnerabilities,
        routeTrivyClusterVulnerabilityDetails,
      ]),
      routeConfiguration.addChildren([
        routeArgocdConfiguration,
        routeClustersConfiguration,
        routeDefectdojoConfiguration,
        routeDependencyTrackConfiguration,
        routeGitopsConfiguration,
        routeGitserversConfiguration,
        routeJiraConfiguration,
        routeNexusConfiguration,
        routeQuicklinksConfiguration,
        routeRegistryConfiguration,
        routeSonarConfiguration,
        routeEventListenerList,
        routeEventListenerDetails,
        routeTriggerList,
        routeTriggerDetails,
        routeTriggerTemplateList,
        routeTriggerTemplateDetails,
        routeTriggerBindingList,
        routeTriggerBindingDetails,
        routeInterceptorList,
        routeInterceptorDetails,
        routeClusterInterceptorList,
        routeClusterInterceptorDetails,
      ]),
      routeK8sMode.addChildren([
        routeK8sOverview,
        routeK8sList,
        routeK8sDetailNamespaced,
        routeK8sDetailCluster,
        routeK8sCRDsDetail,
        routeK8sCRParent.addChildren([routeK8sCRList, routeK8sCRDetailNs, routeK8sCRDetailCluster]),
        routeK8sPodsList,
        routeK8sPodDetail,
        routeK8sNodesList,
        routeK8sNodeDetail,
        routeK8sEvents,
        routeK8sRbacOverview,
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
