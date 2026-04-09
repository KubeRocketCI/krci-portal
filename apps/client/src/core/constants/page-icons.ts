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
  Shield,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Centralized registry of icons for all page types.
 * Used by navigation config and pinned items to ensure consistency.
 */
export const PAGE_ICONS = {
  // Top-level pages
  overview: PanelsTopLeft,
  projects: Box,
  deployments: CloudUpload,

  // CI/CD Pipelines
  pipelineruns: Activity,
  pipelines: Bot,
  tasks: CheckCircle,

  // Observability
  "pipeline-metrics": Activity,

  // Security - SCA
  sca: Shield,
  "sca-projects": Box,

  // Security - SAST
  sast: Box,

  // Security - Container Scanning
  "trivy-overview": Shield,
  "trivy-vulnerabilities": ShieldAlert,
  "trivy-exposed-secrets": AlertCircle,

  // Security - Namespace Security
  "trivy-config-audits": FileText,
  "trivy-rbac-assessments": ShieldCheck,
  "trivy-infra-assessments": Server,

  // Security - Cluster Security
  "trivy-compliance": CheckCircle,
  "trivy-cluster-config-audits": FileText,
  "trivy-cluster-rbac-assessments": ShieldCheck,
  "trivy-cluster-infra-assessments": Server,
  "trivy-cluster-vulnerabilities": ShieldAlert,

  // Configuration - Quick Access
  "config-quicklinks": Link2,

  // Configuration - Artifacts Storage
  "config-nexus": Archive,
  "config-registry": Database,

  // Configuration - Deployment
  "config-clusters": Server,
  "config-gitops": GitBranch,
  "config-argocd": Layers,

  // Configuration - Security
  "config-defectdojo": Shield,
  "config-dependency-track": Shield,

  // Configuration - Code Quality
  "config-sonar": Search,

  // Configuration - VCS
  "config-gitservers": Code,

  // Configuration - Management Tool
  "config-jira": FileText,

  // Detail pages (from ENTITY_ICON)
  project: Box,
  deployment: CloudUpload,
  stage: Layers,
  pipeline: Bot,
  pipelineRun: Activity,
  "sca-project": Shield,
  "sast-project": Shield,
} as const satisfies Record<string, LucideIcon>;

export type PageIconType = keyof typeof PAGE_ICONS;

/**
 * Map from route path to icon type.
 * Used to derive iconType when creating pin configs from navigation items.
 */
export const PATH_TO_ICON_TYPE: Record<string, PageIconType> = {
  // Top-level pages
  "/c/$clusterName/overview/$namespace": "overview",
  "/c/$clusterName/projects": "projects",
  "/c/$clusterName/cdpipelines": "deployments",

  // CI/CD Pipelines
  "/c/$clusterName/cicd/pipelineruns": "pipelineruns",
  "/c/$clusterName/cicd/pipelines": "pipelines",
  "/c/$clusterName/cicd/tasks": "tasks",

  // Observability
  "/c/$clusterName/observability/pipeline-metrics": "pipeline-metrics",

  // Security - SCA
  "/c/$clusterName/security/sca/$namespace": "sca",
  "/c/$clusterName/security/sca-projects/$namespace": "sca-projects",

  // Security - SAST
  "/c/$clusterName/security/sast/$namespace": "sast",

  // Security - Container Scanning
  "/c/$clusterName/security/trivy/overview/$namespace": "trivy-overview",
  "/c/$clusterName/security/trivy/vulnerabilities/$namespace": "trivy-vulnerabilities",
  "/c/$clusterName/security/trivy/exposed-secrets/$namespace": "trivy-exposed-secrets",

  // Security - Namespace Security
  "/c/$clusterName/security/trivy/config-audits/$namespace": "trivy-config-audits",
  "/c/$clusterName/security/trivy/rbac-assessments/$namespace": "trivy-rbac-assessments",
  "/c/$clusterName/security/trivy/infra-assessments/$namespace": "trivy-infra-assessments",

  // Security - Cluster Security
  "/c/$clusterName/security/trivy/compliance/$namespace": "trivy-compliance",
  "/c/$clusterName/security/trivy/cluster-config-audits/$namespace": "trivy-cluster-config-audits",
  "/c/$clusterName/security/trivy/cluster-rbac-assessments/$namespace": "trivy-cluster-rbac-assessments",
  "/c/$clusterName/security/trivy/cluster-infra-assessments/$namespace": "trivy-cluster-infra-assessments",
  "/c/$clusterName/security/trivy/cluster-vulnerabilities/$namespace": "trivy-cluster-vulnerabilities",

  // Configuration - Quick Access
  "/c/$clusterName/configuration/quicklinks/$namespace": "config-quicklinks",

  // Configuration - Artifacts Storage
  "/c/$clusterName/configuration/nexus/$namespace": "config-nexus",
  "/c/$clusterName/configuration/registry/$namespace": "config-registry",

  // Configuration - Deployment
  "/c/$clusterName/configuration/clusters/$namespace": "config-clusters",
  "/c/$clusterName/configuration/gitops/$namespace": "config-gitops",
  "/c/$clusterName/configuration/argocd/$namespace": "config-argocd",

  // Configuration - Security
  "/c/$clusterName/configuration/defectdojo/$namespace": "config-defectdojo",
  "/c/$clusterName/configuration/dependency-track/$namespace": "config-dependency-track",

  // Configuration - Code Quality
  "/c/$clusterName/configuration/sonar/$namespace": "config-sonar",

  // Configuration - VCS
  "/c/$clusterName/configuration/gitservers/$namespace": "config-gitservers",

  // Configuration - Management Tool
  "/c/$clusterName/configuration/jira/$namespace": "config-jira",
};

/**
 * Get the icon type from a route path.
 * Returns undefined if no mapping exists.
 */
export function getIconTypeFromPath(path: string): PageIconType | undefined {
  return PATH_TO_ICON_TYPE[path];
}
