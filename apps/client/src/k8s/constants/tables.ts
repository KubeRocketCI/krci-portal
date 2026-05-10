export const TABLE = {
  GENERAL_PIPELINE_RUN_LIST: {
    id: "generalPipelineRunList",
    name: "Pipeline Run List",
  },
  BRANCH_PIPELINE_RUN_LIST: {
    id: "branchPipelineRunList",
    name: "Branch Pipeline Run List",
  },
  CODEBASE_PIPELINE_RUN_LIST: {
    id: "codebasePipelineRunList",
    name: "Codebase Pipeline Run List",
  },
  PIPELINE_PIPELINE_RUN_LIST: {
    id: "pipelinePipelineRunList",
    name: "Pipeline Pipeline Run List",
  },
  STAGE_PIPELINE_RUN_LIST: {
    id: "stagePipelineRunList",
    name: "Environment Pipeline Run List",
  },
  COMPONENT_LIST: {
    id: "componentList",
    name: "Project List",
  },
  TEMPLATE_LIST: {
    id: "templateList",
    name: "Template List",
  },
  QUICKLINK_LIST: {
    id: "quicklinkList",
    name: "Quicklink List",
  },
  STAGE_APPLICATION_LIST_PREVIEW: {
    id: "stageApplicationListPreview",
    name: "Environment Application List Preview",
  },
  STAGE_APPLICATION_LIST_CONFIGURATION: {
    id: "stageApplicationListConfiguration",
    name: "Environment Application List Configuration",
  },
  STAGE_LIST: {
    id: "stageList",
    name: "Environment List",
  },
  CDPIPELINE_LIST: {
    id: "cdPipelineList",
    name: "Deployments",
  },
  PIPELINE_LIST: {
    id: "pipelineList",
    name: "Pipeline List",
  },
  TASK_LIST: {
    id: "taskList",
    name: "Task List",
  },
  APPLICATION_LIST: {
    id: "applicationList",
    name: "Application List",
  },
  SCA_PROJECTS_LIST: {
    id: "scaProjectsList",
    name: "SCA Projects",
  },
  SAST_PROJECTS_LIST: {
    id: "sastProjectsList",
    name: "SAST Projects",
  },
  TRIVY_VULNERABILITY_REPORTS_LIST: {
    id: "trivyVulnerabilityReportsList",
    name: "Trivy Vulnerability Reports",
  },
  TRIVY_VULNERABILITIES_LIST: {
    id: "trivyVulnerabilitiesList",
    name: "Trivy Vulnerabilities",
  },
  TRIVY_CONFIG_AUDIT_REPORTS_LIST: {
    id: "trivyConfigAuditReportsList",
    name: "Trivy Config Audit Reports",
  },
  TRIVY_CONFIG_AUDIT_CHECKS_LIST: {
    id: "trivyConfigAuditChecksList",
    name: "Trivy Config Audit Checks",
  },
  TRIVY_COMPLIANCE_REPORTS_LIST: {
    id: "trivyComplianceReportsList",
    name: "Trivy Compliance Reports",
  },
  TRIVY_COMPLIANCE_CONTROLS_LIST: {
    id: "trivyComplianceControlsList",
    name: "Trivy Compliance Controls",
  },
  TRIVY_EXPOSED_SECRET_REPORTS_LIST: {
    id: "trivyExposedSecretReportsList",
    name: "Trivy Exposed Secret Reports",
  },
  TRIVY_EXPOSED_SECRETS_LIST: {
    id: "trivyExposedSecretsList",
    name: "Trivy Exposed Secrets",
  },
  TRIVY_RBAC_ASSESSMENT_REPORTS_LIST: {
    id: "trivyRbacAssessmentReportsList",
    name: "Trivy RBAC Assessment Reports",
  },
  TRIVY_RBAC_ASSESSMENT_CHECKS_LIST: {
    id: "trivyRbacAssessmentChecksList",
    name: "Trivy RBAC Assessment Checks",
  },
  TRIVY_CLUSTER_RBAC_ASSESSMENT_REPORTS_LIST: {
    id: "trivyClusterRbacAssessmentReportsList",
    name: "Trivy Cluster RBAC Assessment Reports",
  },
  TRIVY_CLUSTER_RBAC_ASSESSMENT_CHECKS_LIST: {
    id: "trivyClusterRbacAssessmentChecksList",
    name: "Trivy Cluster RBAC Assessment Checks",
  },
  TRIVY_INFRA_ASSESSMENT_REPORTS_LIST: {
    id: "trivyInfraAssessmentReportsList",
    name: "Trivy Infrastructure Assessment Reports",
  },
  TRIVY_INFRA_ASSESSMENT_CHECKS_LIST: {
    id: "trivyInfraAssessmentChecksList",
    name: "Trivy Infrastructure Assessment Checks",
  },
  TRIVY_CLUSTER_INFRA_ASSESSMENT_REPORTS_LIST: {
    id: "trivyClusterInfraAssessmentReportsList",
    name: "Trivy Cluster Infrastructure Assessment Reports",
  },
  TRIVY_CLUSTER_INFRA_ASSESSMENT_CHECKS_LIST: {
    id: "trivyClusterInfraAssessmentChecksList",
    name: "Trivy Cluster Infrastructure Assessment Checks",
  },
  TRIVY_CLUSTER_CONFIG_AUDIT_REPORTS_LIST: {
    id: "trivyClusterConfigAuditReportsList",
    name: "Trivy Cluster Config Audit Reports",
  },
  TRIVY_CLUSTER_CONFIG_AUDIT_CHECKS_LIST: {
    id: "trivyClusterConfigAuditChecksList",
    name: "Trivy Cluster Config Audit Checks",
  },
  TRIVY_CLUSTER_VULNERABILITY_REPORTS_LIST: {
    id: "trivyClusterVulnerabilityReportsList",
    name: "Trivy Cluster Vulnerability Reports",
  },
  TRIVY_CLUSTER_VULNERABILITIES_LIST: {
    id: "trivyClusterVulnerabilitiesList",
    name: "Trivy Cluster Vulnerabilities",
  },
  CODEBASE_DEPLOYMENTS: {
    id: "codebaseDeployments",
    name: "Codebase Deployments",
  },
  BRANCH_LIST: {
    id: "branchList",
    name: "Branch List",
  },
} as const;

export const TABLE_ID_K8S_PODS = "k8s-pods" as const;
export const TABLE_ID_K8S_DEPLOYMENTS = "k8s-deployments" as const;
export const TABLE_ID_K8S_STATEFULSETS = "k8s-statefulsets" as const;
export const TABLE_ID_K8S_DAEMONSETS = "k8s-daemonsets" as const;
export const TABLE_ID_K8S_JOBS = "k8s-jobs" as const;
export const TABLE_ID_K8S_CRONJOBS = "k8s-cronjobs" as const;
export const TABLE_ID_K8S_HPAS = "k8s-hpas" as const;
export const TABLE_ID_K8S_SERVICES = "k8s-services" as const;
export const TABLE_ID_K8S_INGRESSES = "k8s-ingresses" as const;
export const TABLE_ID_K8S_PVCS = "k8s-pvcs" as const;
export const TABLE_ID_K8S_PVS = "k8s-pvs" as const;
export const TABLE_ID_K8S_STORAGE_CLASSES = "k8s-storage-classes" as const;
export const TABLE_ID_K8S_CONFIG_MAPS = "k8s-config-maps" as const;
export const TABLE_ID_K8S_SECRETS = "k8s-secrets" as const;
export const TABLE_ID_K8S_NAMESPACES = "k8s-namespaces" as const;
export const TABLE_ID_K8S_NODES = "k8s-nodes" as const;
export const TABLE_ID_K8S_EVENTS = "k8s-events" as const;
export const TABLE_ID_K8S_ROLES = "k8s-roles" as const;
export const TABLE_ID_K8S_ROLE_BINDINGS = "k8s-role-bindings" as const;
export const TABLE_ID_K8S_CLUSTER_ROLES = "k8s-cluster-roles" as const;
export const TABLE_ID_K8S_CLUSTER_ROLE_BINDINGS = "k8s-cluster-role-bindings" as const;
