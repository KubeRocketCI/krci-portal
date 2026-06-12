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
  FileCode,
  FileText,
  Funnel,
  GitBranch,
  Globe,
  Layers,
  Link2,
  PanelsTopLeft,
  Search,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Webhook,
  Zap,
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

  // CI/CD Webhook Triggers (icons mirror navigationConfig.ts entries)
  "event-listeners": Webhook,
  triggers: Zap,
  "trigger-templates": FileCode,
  "trigger-bindings": Link2,
  interceptors: Funnel,
  "cluster-interceptors": Globe,

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

  // CI/CD Webhook Triggers
  "/c/$clusterName/cicd/webhook-triggers/event-listeners": "event-listeners",
  "/c/$clusterName/cicd/webhook-triggers/triggers": "triggers",
  "/c/$clusterName/cicd/webhook-triggers/trigger-templates": "trigger-templates",
  "/c/$clusterName/cicd/webhook-triggers/trigger-bindings": "trigger-bindings",
  "/c/$clusterName/cicd/webhook-triggers/interceptors": "interceptors",
  "/c/$clusterName/cicd/webhook-triggers/cluster-interceptors": "cluster-interceptors",

  // Observability
  "/c/$clusterName/observability/pipeline-metrics/$namespace": "pipeline-metrics",

  // Security - SCA
  "/c/$clusterName/security/sca/$namespace": "sca",
  "/c/$clusterName/security/sca/projects/$namespace": "sca-projects",

  // Security - SAST
  "/c/$clusterName/security/sast/projects/$namespace": "sast",

  // Security - Container Scanning
  "/c/$clusterName/security/trivy": "trivy-overview",
  "/c/$clusterName/security/trivy/vulnerabilities": "trivy-vulnerabilities",
  "/c/$clusterName/security/container/exposed-secrets": "trivy-exposed-secrets",

  // Security - Namespace Security
  "/c/$clusterName/security/namespace/config-audits": "trivy-config-audits",
  "/c/$clusterName/security/namespace/rbac-assessments": "trivy-rbac-assessments",
  "/c/$clusterName/security/namespace/infra-assessments": "trivy-infra-assessments",

  // Security - Cluster Security
  "/c/$clusterName/security/cluster/compliance": "trivy-compliance",
  "/c/$clusterName/security/cluster/config-audits": "trivy-cluster-config-audits",
  "/c/$clusterName/security/cluster/rbac-assessments": "trivy-cluster-rbac-assessments",
  "/c/$clusterName/security/cluster/infra-assessments": "trivy-cluster-infra-assessments",
  "/c/$clusterName/security/cluster/vulnerabilities": "trivy-cluster-vulnerabilities",

  // Configuration - Quick Access
  "/c/$clusterName/configuration/quicklinks": "config-quicklinks",

  // Configuration - Artifacts Storage
  "/c/$clusterName/configuration/nexus": "config-nexus",
  "/c/$clusterName/configuration/registry": "config-registry",

  // Configuration - Deployment
  "/c/$clusterName/configuration/clusters": "config-clusters",
  "/c/$clusterName/configuration/gitops": "config-gitops",
  "/c/$clusterName/configuration/argocd": "config-argocd",

  // Configuration - Security
  "/c/$clusterName/configuration/defectdojo": "config-defectdojo",
  "/c/$clusterName/configuration/dependency-track": "config-dependency-track",

  // Configuration - Code Quality
  "/c/$clusterName/configuration/sonar": "config-sonar",

  // Configuration - VCS
  "/c/$clusterName/configuration/gitservers": "config-gitservers",

  // Configuration - Management Tool
  "/c/$clusterName/configuration/jira": "config-jira",
};

/**
 * Get the icon type from a route path.
 * Returns undefined if no mapping exists.
 */
export function getIconTypeFromPath(path: string): PageIconType | undefined {
  return PATH_TO_ICON_TYPE[path];
}
