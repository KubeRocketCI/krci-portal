import React from "react";
import { Info, GitBranch, GitPullRequest, Shield, AlertTriangle } from "lucide-react";
import { ENTITY_ICON } from "@/k8s/constants/entity-icons";
import { router } from "@/core/router";
import { BranchList } from "../components/BranchList";
import { PullRequestList } from "../components/PullRequestList";
import { Overview } from "../components/Overview";
import { PipelineList } from "../components/PipelineList";
import { DeploymentStatusWidget } from "../components/DeploymentStatusWidget";
import { SecurityTab } from "../components/SecurityTab";
import { VulnerabilitiesTab } from "../components/VulnerabilitiesTab";
import { useCodebaseWatch } from "../hooks/data";
import { routeProjectDetails, RouteSearchTab, routeSearchTabSchema, PATH_PROJECT_DETAILS_FULL } from "../route";

export const usePageTabs = () => {
  const params = routeProjectDetails.useParams();
  const codebaseWatch = useCodebaseWatch();
  const codebase = codebaseWatch.query.data;

  const handleTabNavigate = React.useCallback(
    (tab: RouteSearchTab) => {
      router.navigate({
        to: PATH_PROJECT_DETAILS_FULL,
        params,
        search: (prev) => ({ ...prev, tab }),
      });
    },
    [params]
  );

  return React.useMemo(() => {
    return [
      {
        label: "Overview",
        icon: <Info className="size-4" />,
        id: routeSearchTabSchema.enum.overview,
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.overview),
        component: <Overview />,
      },
      {
        label: "Branches",
        icon: <GitBranch className="size-4" />,
        id: routeSearchTabSchema.enum.branches,
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.branches),
        component: <BranchList />,
      },
      {
        label: "Pipelines",
        icon: <ENTITY_ICON.pipeline className="size-4" />,
        id: routeSearchTabSchema.enum.pipelines,
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.pipelines),
        component: <PipelineList />,
      },
      {
        label: "Code Quality",
        icon: <Shield className="size-4" />,
        id: routeSearchTabSchema.enum.security,
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.security),
        component: (
          <SecurityTab codebaseName={params.name} namespace={params.namespace} clusterName={params.clusterName} />
        ),
      },
      {
        label: "Dependencies",
        icon: <AlertTriangle className="size-4" />,
        id: routeSearchTabSchema.enum.vulnerabilities,
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.vulnerabilities),
        component: codebase?.spec?.defaultBranch ? (
          <VulnerabilitiesTab
            codebaseName={params.name}
            defaultBranch={codebase.spec.defaultBranch}
            namespace={params.namespace}
            clusterName={params.clusterName}
          />
        ) : null,
      },
      {
        label: "Pull Requests",
        icon: <GitPullRequest className="size-4" />,
        id: routeSearchTabSchema.enum.code,
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.code),
        component: <PullRequestList />,
      },
      {
        label: "Deployments",
        icon: <ENTITY_ICON.deployment className="size-4" />,
        id: routeSearchTabSchema.enum.deployments,
        onClick: () => handleTabNavigate(routeSearchTabSchema.enum.deployments),
        component: <DeploymentStatusWidget />,
      },
    ];
  }, [handleTabNavigate, params.name, params.namespace, params.clusterName, codebase?.spec?.defaultBranch]);
};
