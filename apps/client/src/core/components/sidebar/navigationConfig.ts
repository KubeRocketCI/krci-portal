import { Bot, Layers, PanelsTopLeft, Rows2, Settings, ShoppingCart } from "lucide-react";
import { routeOverviewDetails } from "@/modules/platform/overview/pages/details/route";
import { routeComponentList } from "@/modules/platform/codebases/pages/list/route";
import { routeCDPipelineList } from "@/modules/platform/cdpipelines/pages/list/route";
import { routePipelineRunList } from "@/modules/platform/pipelineruns/pages/list/route";
import { routeTaskList } from "@/modules/platform/tasks/pages/list/route";
import { routeCICD, routeConfiguration } from "@/core/router";
import { routePipelineList } from "@/modules/platform/pipelines/pages/list/route";
import { routeQuicklinksConfiguration } from "@/modules/platform/configuration/modules/quicklinks/route";
import { routeNexusConfiguration } from "@/modules/platform/configuration/modules/nexus/route";
import { routeRegistryConfiguration } from "@/modules/platform/configuration/modules/registry/route";
import { routeClustersConfiguration } from "@/modules/platform/configuration/modules/clusters/route";
import { routeGitopsConfiguration } from "@/modules/platform/configuration/modules/gitops/route";
import { routeArgocdConfiguration } from "@/modules/platform/configuration/modules/argocd/route";
import { routeDefectdojoConfiguration } from "@/modules/platform/configuration/modules/defectdojo/route";
import { routeDependencyTrackConfiguration } from "@/modules/platform/configuration/modules/dependency-track/route";
import { routeSonarConfiguration } from "@/modules/platform/configuration/modules/sonar/route";
import { routeGitserversConfiguration } from "@/modules/platform/configuration/modules/gitservers/route";
import { routeJiraConfiguration } from "@/modules/platform/configuration/modules/jira/route";
// import { routeChatAssistantConfiguration } from "@/modules/platform/configuration/modules/chat-assistant/route";
// import { routeCodemieConfiguration } from "@/modules/platform/configuration/modules/codemie/route";
import type { NavItem } from "./types";
import { routeMarketplace } from "@/modules/platform/marketplace/route";

/**
 * Creates the navigation configuration for the sidebar
 * @param clusterName - The current cluster name
 * @param namespace - The current namespace
 * @returns Array of navigation items
 */
export const createNavigationConfig = (clusterName: string, namespace: string): NavItem[] => {
  const clusterDefaultParams = {
    clusterName,
    namespace,
  };

  return [
    {
      title: "Overview",
      icon: PanelsTopLeft,
      route: {
        to: routeOverviewDetails.to,
        params: clusterDefaultParams,
      },
    },
    {
      title: "CI/CD Pipelines",
      icon: Bot,
      defaultRoute: {
        to: routePipelineRunList.to,
        params: clusterDefaultParams,
      },
      groupRoute: routeCICD,
      children: [
        {
          title: "PipelineRuns",
          route: {
            to: routePipelineRunList.to,
            params: clusterDefaultParams,
          },
        },
        {
          title: "Pipelines",
          route: {
            to: routePipelineList.to,
            params: clusterDefaultParams,
          },
        },
        {
          title: "Tasks",
          route: {
            to: routeTaskList.to,
            params: clusterDefaultParams,
          },
        },
      ],
    },
    {
      title: "Marketplace",
      icon: ShoppingCart,
      route: {
        to: routeMarketplace.to,
        params: clusterDefaultParams,
      },
    },
    {
      title: "Components",
      icon: Layers,
      route: {
        to: routeComponentList.to,
        params: clusterDefaultParams,
      },
    },
    {
      title: "Deployment Flows",
      icon: Rows2,
      route: {
        to: routeCDPipelineList.to,
        params: clusterDefaultParams,
      },
    },
    {
      title: "Configuration",
      icon: Settings,
      defaultRoute: {
        to: routeQuicklinksConfiguration.to,
        params: clusterDefaultParams,
      },
      groupRoute: routeConfiguration,
      children: [
        {
          title: "Quick Access",
          children: [
            {
              title: "QuickLinks",
              route: {
                to: routeQuicklinksConfiguration.to,
                params: clusterDefaultParams,
              },
            },
          ],
        },
        {
          title: "Artifacts Storage",
          children: [
            {
              title: "Nexus",
              route: {
                to: routeNexusConfiguration.to,
                params: clusterDefaultParams,
              },
            },
            {
              title: "Registry",
              route: {
                to: routeRegistryConfiguration.to,
                params: clusterDefaultParams,
              },
            },
          ],
        },
        {
          title: "Deployment",
          children: [
            {
              title: "Clusters",
              route: {
                to: routeClustersConfiguration.to,
                params: clusterDefaultParams,
              },
            },
            {
              title: "GitOps",
              route: {
                to: routeGitopsConfiguration.to,
                params: clusterDefaultParams,
              },
            },
            {
              title: "ArgoCD",
              route: {
                to: routeArgocdConfiguration.to,
                params: clusterDefaultParams,
              },
            },
          ],
        },
        {
          title: "Security",
          children: [
            {
              title: "DefectDojo",
              route: {
                to: routeDefectdojoConfiguration.to,
                params: clusterDefaultParams,
              },
            },
            {
              title: "DependencyTrack",
              route: {
                to: routeDependencyTrackConfiguration.to,
                params: clusterDefaultParams,
              },
            },
          ],
        },
        {
          title: "Code Quality",
          children: [
            {
              title: "SonarQube",
              route: {
                to: routeSonarConfiguration.to,
                params: clusterDefaultParams,
              },
            },
          ],
        },
        {
          title: "VCS",
          children: [
            {
              title: "Git Servers",
              route: {
                to: routeGitserversConfiguration.to,
                params: clusterDefaultParams,
              },
            },
          ],
        },
        {
          title: "Management Tool",
          children: [
            {
              title: "Jira",
              route: {
                to: routeJiraConfiguration.to,
                params: clusterDefaultParams,
              },
            },
          ],
        },
        // {
        //   title: "Gen AI",
        //   children: [
        //     {
        //       title: "Chat Assistant",
        //       route: {
        //         to: routeChatAssistantConfiguration.to,
        //         params: clusterDefaultParams,
        //       },
        //     },
        //     {
        //       title: "Codemie",
        //       route: {
        //         to: routeCodemieConfiguration.to,
        //         params: clusterDefaultParams,
        //       },
        //     },
        //   ],
        // },
      ],
    },
  ] as const satisfies NavItem[];
};
