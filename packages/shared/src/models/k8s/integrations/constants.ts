export const integrationSecretName = {
  JIRA: "ci-jira",
  DEFECT_DOJO: "ci-defectdojo",
  DEPENDENCY_TRACK: "ci-dependency-track",
  NEXUS: "ci-nexus",
  SONAR: "ci-sonarqube",
  SSO: "keycloak",
  ARGO_CD: "ci-argocd",
  CHAT_ASSISTANT: "chat-assistant",
} as const;

export const SECRET_LABEL_SECRET_TYPE = "app.edp.epam.com/secret-type";
export const SECRET_LABEL_INTEGRATION_SECRET = "app.edp.epam.com/integration-secret";
export const SECRET_LABEL_CLUSTER_TYPE = "app.edp.epam.com/cluster-type";

export const SECRET_ANNOTATION_INTEGRATION_SECRET_CONNECTED = "app.edp.epam.com/integration-secret-connected";
export const SECRET_ANNOTATION_INTEGRATION_SECRET_ERROR = "app.edp.epam.com/integration-secret-error";

export const SECRET_ANNOTATION_CLUSTER_CONNECTED = "app.edp.epam.com/cluster-connected";
export const SECRET_ANNOTATION_CLUSTER_ERROR = "app.edp.epam.com/cluster-error";
