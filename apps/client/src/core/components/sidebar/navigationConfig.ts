import {
  Activity,
  AlertCircle,
  Archive,
  Bot,
  Box,
  CheckCircle,
  CloudUpload,
  Code,
  Database,
  FileText,
  GitBranch,
  Layers,
  Link2,
  PanelsTopLeft,
  Search,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { routeCICD, routeConfiguration, routeObservability, routeSecurity } from "@/core/router";
import { PATH_OVERVIEW_FULL } from "@/modules/platform/overview/pages/details/route";
import { PATH_PIPELINE_METRICS_FULL } from "@/modules/platform/observability/pages/pipeline-metrics/route";
import { PATH_SCA_FULL } from "@/modules/platform/security/pages/sca/route";
import { PATH_SCA_PROJECTS_FULL } from "@/modules/platform/security/pages/sca-projects/route";
import { PATH_SAST_FULL } from "@/modules/platform/security/pages/sast/route";
import { PATH_TRIVY_VULNERABILITIES_FULL } from "@/modules/platform/security/pages/trivy-vulnerabilities/route";
import { PATH_TRIVY_OVERVIEW_FULL } from "@/modules/platform/security/pages/trivy-overview/route";
import { PATH_TRIVY_CONFIG_AUDITS_FULL } from "@/modules/platform/security/pages/trivy-config-audits/route";
import { PATH_TRIVY_COMPLIANCE_FULL } from "@/modules/platform/security/pages/trivy-compliance/route";
import { PATH_TRIVY_EXPOSED_SECRETS_FULL } from "@/modules/platform/security/pages/trivy-exposed-secrets/route";
import { PATH_TRIVY_RBAC_ASSESSMENTS_FULL } from "@/modules/platform/security/pages/trivy-rbac-assessments/route";
import { PATH_TRIVY_CLUSTER_RBAC_ASSESSMENTS_FULL } from "@/modules/platform/security/pages/trivy-cluster-rbac-assessments/route";
import { PATH_TRIVY_INFRA_ASSESSMENTS_FULL } from "@/modules/platform/security/pages/trivy-infra-assessments/route";
import { PATH_TRIVY_CLUSTER_INFRA_ASSESSMENTS_FULL } from "@/modules/platform/security/pages/trivy-cluster-infra-assessments/route";
import { PATH_TRIVY_CLUSTER_CONFIG_AUDITS_FULL } from "@/modules/platform/security/pages/trivy-cluster-config-audits/route";
import { PATH_TRIVY_CLUSTER_VULNERABILITIES_FULL } from "@/modules/platform/security/pages/trivy-cluster-vulnerabilities/route";
import { PATH_PROJECTS_FULL } from "@/modules/platform/codebases/pages/list/route";
import { PATH_CDPIPELINES_FULL } from "@/modules/platform/cdpipelines/pages/list/route";
import { PATH_PIPELINERUNS_FULL } from "@/modules/platform/tekton/pages/pipelinerun-list/route";
import { PATH_PIPELINES_FULL } from "@/modules/platform/tekton/pages/pipeline-list/route";
import { PATH_TASKS_FULL } from "@/modules/platform/tekton/pages/task-list/route";
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

export function createNavigationConfig(clusterName: string, namespace: string): NavItem[] {
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
          icon: Activity,
          route: {
            to: PATH_PIPELINERUNS_FULL,
            params: clusterDefaultParams,
          },
        },
        {
          title: "Pipelines",
          icon: Bot,
          route: {
            to: PATH_PIPELINES_FULL,
            params: clusterDefaultParams,
          },
        },
        {
          title: "Tasks",
          icon: CheckCircle,
          route: {
            to: PATH_TASKS_FULL,
            params: clusterDefaultParams,
          },
        },
      ],
    },
    {
      title: "Projects",
      icon: Box,
      route: {
        to: PATH_PROJECTS_FULL,
        params: clusterDefaultParams,
      },
    },
    {
      title: "Deployments",
      icon: CloudUpload,
      route: {
        to: PATH_CDPIPELINES_FULL,
        params: clusterDefaultParams,
      },
    },
    {
      title: "Observability",
      icon: Activity,
      defaultRoute: {
        to: PATH_PIPELINE_METRICS_FULL,
        params: clusterDefaultParams,
      },
      groupRoute: routeObservability,
      children: [
        {
          title: "Pipeline Metrics",
          icon: Activity,
          route: {
            to: PATH_PIPELINE_METRICS_FULL,
            params: clusterDefaultParams,
          },
        },
      ],
    },
    {
      title: "Security",
      icon: Shield,
      defaultRoute: {
        to: PATH_SCA_FULL,
        params: clusterDefaultParams,
      },
      groupRoute: routeSecurity,
      children: [
        {
          title: "SCA",
          children: [
            {
              title: "Overview",
              icon: Shield,
              route: {
                to: PATH_SCA_FULL,
                params: clusterDefaultParams,
              },
            },
            {
              title: "Projects",
              icon: Box,
              route: {
                to: PATH_SCA_PROJECTS_FULL,
                params: clusterDefaultParams,
              },
            },
          ],
        },
        {
          title: "SAST",
          children: [
            {
              title: "Projects",
              icon: Box,
              route: {
                to: PATH_SAST_FULL,
                params: clusterDefaultParams,
              },
            },
          ],
        },
        {
          title: "Container Scanning",
          children: [
            {
              title: "Overview",
              icon: Shield,
              route: {
                to: PATH_TRIVY_OVERVIEW_FULL,
                params: clusterDefaultParams,
              },
            },
            {
              title: "Vulnerability Reports",
              icon: ShieldAlert,
              route: {
                to: PATH_TRIVY_VULNERABILITIES_FULL,
                params: clusterDefaultParams,
              },
            },
            {
              title: "Exposed Secrets",
              icon: AlertCircle,
              route: {
                to: PATH_TRIVY_EXPOSED_SECRETS_FULL,
                params: clusterDefaultParams,
              },
            },
          ],
        },
        {
          title: "Namespace Security",
          children: [
            {
              title: "Configuration Audits",
              icon: FileText,
              route: {
                to: PATH_TRIVY_CONFIG_AUDITS_FULL,
                params: clusterDefaultParams,
              },
            },
            {
              title: "RBAC Assessments",
              icon: ShieldCheck,
              route: {
                to: PATH_TRIVY_RBAC_ASSESSMENTS_FULL,
                params: clusterDefaultParams,
              },
            },
            {
              title: "Infrastructure Assessments",
              icon: Server,
              route: {
                to: PATH_TRIVY_INFRA_ASSESSMENTS_FULL,
                params: clusterDefaultParams,
              },
            },
          ],
        },
        {
          title: "Cluster Security",
          children: [
            {
              title: "Compliance",
              icon: CheckCircle,
              route: {
                to: PATH_TRIVY_COMPLIANCE_FULL,
                params: clusterDefaultParams,
              },
            },
            {
              title: "Configuration Audits",
              icon: FileText,
              route: {
                to: PATH_TRIVY_CLUSTER_CONFIG_AUDITS_FULL,
                params: clusterDefaultParams,
              },
            },
            {
              title: "RBAC Assessments",
              icon: ShieldCheck,
              route: {
                to: PATH_TRIVY_CLUSTER_RBAC_ASSESSMENTS_FULL,
                params: clusterDefaultParams,
              },
            },
            {
              title: "Infrastructure Assessments",
              icon: Server,
              route: {
                to: PATH_TRIVY_CLUSTER_INFRA_ASSESSMENTS_FULL,
                params: clusterDefaultParams,
              },
            },
            {
              title: "Vulnerability Reports",
              icon: ShieldAlert,
              route: {
                to: PATH_TRIVY_CLUSTER_VULNERABILITIES_FULL,
                params: clusterDefaultParams,
              },
            },
          ],
        },
      ],
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
              icon: Link2,
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
              icon: Archive,
              route: {
                to: PATH_CONFIG_NEXUS_FULL,
                params: clusterDefaultParams,
              },
            },
            {
              title: "Registry",
              icon: Database,
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
              icon: Server,
              route: {
                to: PATH_CONFIG_CLUSTERS_FULL,
                params: clusterDefaultParams,
              },
            },
            {
              title: "GitOps",
              icon: GitBranch,
              route: {
                to: PATH_CONFIG_GITOPS_FULL,
                params: clusterDefaultParams,
              },
            },
            {
              title: "ArgoCD",
              icon: Layers,
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
              icon: Shield,
              route: {
                to: PATH_CONFIG_DEFECTDOJO_FULL,
                params: clusterDefaultParams,
              },
            },
            {
              title: "DependencyTrack",
              icon: Shield,
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
              icon: Search,
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
              icon: Code,
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
              icon: FileText,
              route: {
                to: PATH_CONFIG_JIRA_FULL,
                params: clusterDefaultParams,
              },
            },
          ],
        },
      ],
    },
  ] as const satisfies NavItem[];
}
