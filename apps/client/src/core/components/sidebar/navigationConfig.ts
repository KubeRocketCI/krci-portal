import { Bot, Layers, PanelsTopLeft, Rows2, Settings, ShoppingCart } from "lucide-react";
import { routeCICD, routeConfiguration } from "@/core/router";
import { PATH_OVERVIEW_FULL } from "@/modules/platform/overview/pages/details/route";
import { PATH_COMPONENTS_FULL } from "@/modules/platform/codebases/pages/list/route";
import { PATH_MARKETPLACE_FULL } from "@/modules/platform/marketplace/route";
import { PATH_CDPIPELINES_FULL } from "@/modules/platform/cdpipelines/pages/list/route";
import { PATH_PIPELINERUNS_FULL } from "@/modules/platform/pipelineruns/pages/list/route";
import { PATH_PIPELINES_FULL } from "@/modules/platform/pipelines/pages/list/route";
import { PATH_TASKS_FULL } from "@/modules/platform/tasks/pages/list/route";
import { PATH_CONFIG_QUICKLINKS_FULL } from "@/modules/platform/configuration/modules/quicklinks/route";
import { PATH_CONFIG_NEXUS_FULL } from "@/modules/platform/configuration/modules/nexus/route";
import { PATH_CONFIG_REGISTRY_FULL } from "@/modules/platform/configuration/modules/registry/route";
import { PATH_CONFIG_CLUSTERS_FULL } from "@/modules/platform/configuration/modules/clusters/route";
import { PATH_CONFIG_GITOPS_FULL } from "@/modules/platform/configuration/modules/gitops/route";
import { PATH_CONFIG_ARGOCD_FULL } from "@/modules/platform/configuration/modules/argocd/route";
import { PATH_CONFIG_DEFECTDOJO_FULL } from "@/modules/platform/configuration/modules/defectdojo/route";
import { PATH_CONFIG_DEPENDENCY_TRACK_FULL } from "@/modules/platform/configuration/modules/dependency-track/route";
import { PATH_CONFIG_SONAR_FULL } from "@/modules/platform/configuration/modules/sonar/route";
import { PATH_CONFIG_GITSERVERS_FULL } from "@/modules/platform/configuration/modules/gitservers/route";
import { PATH_CONFIG_JIRA_FULL } from "@/modules/platform/configuration/modules/jira/route";
import type { NavItem } from "./types";

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
        to: PATH_OVERVIEW_FULL,
        params: clusterDefaultParams,
      },
    },
    {
      title: "CI/CD Pipelines",
      icon: Bot,
      defaultRoute: {
        to: PATH_PIPELINERUNS_FULL,
        params: clusterDefaultParams,
      },
      groupRoute: routeCICD,
      children: [
        {
          title: "PipelineRuns",
          route: {
            to: PATH_PIPELINERUNS_FULL,
            params: clusterDefaultParams,
          },
        },
        {
          title: "Pipelines",
          route: {
            to: PATH_PIPELINES_FULL,
            params: clusterDefaultParams,
          },
        },
        {
          title: "Tasks",
          route: {
            to: PATH_TASKS_FULL,
            params: clusterDefaultParams,
          },
        },
      ],
    },
    {
      title: "Marketplace",
      icon: ShoppingCart,
      route: {
        to: PATH_MARKETPLACE_FULL,
        params: clusterDefaultParams,
      },
    },
    {
      title: "Components",
      icon: Layers,
      route: {
        to: PATH_COMPONENTS_FULL,
        params: clusterDefaultParams,
      },
    },
    {
      title: "Deployment Flows",
      icon: Rows2,
      route: {
        to: PATH_CDPIPELINES_FULL,
        params: clusterDefaultParams,
      },
    },
    {
      title: "Configuration",
      icon: Settings,
      defaultRoute: {
        to: PATH_CONFIG_QUICKLINKS_FULL,
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
                to: PATH_CONFIG_QUICKLINKS_FULL,
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
                to: PATH_CONFIG_NEXUS_FULL,
                params: clusterDefaultParams,
              },
            },
            {
              title: "Registry",
              route: {
                to: PATH_CONFIG_REGISTRY_FULL,
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
                to: PATH_CONFIG_CLUSTERS_FULL,
                params: clusterDefaultParams,
              },
            },
            {
              title: "GitOps",
              route: {
                to: PATH_CONFIG_GITOPS_FULL,
                params: clusterDefaultParams,
              },
            },
            {
              title: "ArgoCD",
              route: {
                to: PATH_CONFIG_ARGOCD_FULL,
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
                to: PATH_CONFIG_DEFECTDOJO_FULL,
                params: clusterDefaultParams,
              },
            },
            {
              title: "DependencyTrack",
              route: {
                to: PATH_CONFIG_DEPENDENCY_TRACK_FULL,
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
                to: PATH_CONFIG_SONAR_FULL,
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
                to: PATH_CONFIG_GITSERVERS_FULL,
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
                to: PATH_CONFIG_JIRA_FULL,
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
