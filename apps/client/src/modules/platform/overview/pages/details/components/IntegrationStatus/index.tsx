import { useMemo, useState } from "react";
import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import { DashboardCard } from "@/modules/platform/overview/components/DashboardCard";
import { STATUS_COLOR, MAIN_COLOR } from "@/k8s/constants/colors";
import { useSecretWatchList } from "@/k8s/api/groups/Core/Secret";
import { useJiraServerWatchList } from "@/k8s/api/groups/KRCI/JiraServer";
import { useClusterStore } from "@/k8s/store";
import {
  integrationSecretName,
  getIntegrationSecretStatus,
  getJiraServerStatus,
  jiraServerStatus,
  SECRET_LABEL_INTEGRATION_SECRET,
  type Secret,
  type JiraServer,
} from "@my-project/shared";
import { Link } from "@tanstack/react-router";
import { PATH_CONFIG_SONAR_FULL } from "@/modules/platform/configuration/modules/sonar/route";
import { PATH_CONFIG_NEXUS_FULL } from "@/modules/platform/configuration/modules/nexus/route";
import { PATH_CONFIG_ARGOCD_FULL } from "@/modules/platform/configuration/modules/argocd/route";
import { PATH_CONFIG_DEPENDENCY_TRACK_FULL } from "@/modules/platform/configuration/modules/dependency-track/route";
import { PATH_CONFIG_DEFECTDOJO_FULL } from "@/modules/platform/configuration/modules/defectdojo/route";
import { PATH_CONFIG_JIRA_FULL } from "@/modules/platform/configuration/modules/jira/route";
import { Plug, CheckCircle, AlertTriangle, ChevronDown } from "lucide-react";
import { LoadingState } from "@/modules/platform/overview/components/LoadingState";
import { useShallow } from "zustand/react/shallow";

interface SecretBasedIntegration {
  name: string;
  secretName: string;
  configPath: string;
}

const SECRET_BASED_INTEGRATIONS: SecretBasedIntegration[] = [
  { name: "SonarQube", secretName: integrationSecretName.SONAR, configPath: PATH_CONFIG_SONAR_FULL },
  {
    name: "DependencyTrack",
    secretName: integrationSecretName.DEPENDENCY_TRACK,
    configPath: PATH_CONFIG_DEPENDENCY_TRACK_FULL,
  },
  { name: "ArgoCD", secretName: integrationSecretName.ARGO_CD, configPath: PATH_CONFIG_ARGOCD_FULL },
  { name: "Nexus", secretName: integrationSecretName.NEXUS, configPath: PATH_CONFIG_NEXUS_FULL },
  { name: "DefectDojo", secretName: integrationSecretName.DEFECT_DOJO, configPath: PATH_CONFIG_DEFECTDOJO_FULL },
];

type ConnectionStatus = "connected" | "error" | "unknown" | "not-configured";

interface IntegrationStatusItem {
  name: string;
  status: ConnectionStatus;
  errorMessage?: string;
  configPath: string;
}

function getSecretConnectionStatus(secret: Secret | undefined): { status: ConnectionStatus; errorMessage?: string } {
  if (!secret) return { status: "not-configured" };

  const { connected, statusError } = getIntegrationSecretStatus(secret);

  if (connected === "true") return { status: "connected" };
  if (connected === "false") return { status: "error", errorMessage: statusError };
  return { status: "unknown" };
}

function getJiraConnectionStatus(jiraServer: JiraServer | undefined): IntegrationStatusItem {
  if (!jiraServer) {
    return { name: "Jira", status: "not-configured", configPath: PATH_CONFIG_JIRA_FULL };
  }

  const { status, errorMessage } = getJiraServerStatus(jiraServer);

  const statusMap: Record<string, ConnectionStatus> = {
    [jiraServerStatus.finished]: "connected",
    [jiraServerStatus.error]: "error",
  };

  return {
    name: "Jira",
    status: statusMap[status] || "unknown",
    errorMessage: status === jiraServerStatus.error ? errorMessage : undefined,
    configPath: PATH_CONFIG_JIRA_FULL,
  };
}

export function IntegrationStatus() {
  const secretListWatch = useSecretWatchList({
    labels: { [SECRET_LABEL_INTEGRATION_SECRET]: "true" },
  });
  const jiraServerListWatch = useJiraServerWatchList();

  const clusterName = useClusterStore(useShallow((state) => state.clusterName));

  const integrations = useMemo((): IntegrationStatusItem[] => {
    const secretsByName = new Map<string, Secret>();
    for (const secret of secretListWatch.data.array) {
      if (secret.metadata.name) {
        secretsByName.set(secret.metadata.name, secret);
      }
    }

    const secretBased: IntegrationStatusItem[] = SECRET_BASED_INTEGRATIONS.map((def) => {
      const secret = secretsByName.get(def.secretName);
      const { status, errorMessage } = getSecretConnectionStatus(secret);
      return { name: def.name, status, errorMessage, configPath: def.configPath };
    });

    const jiraServer = jiraServerListWatch.data.array[0];
    const jiraItem = getJiraConnectionStatus(jiraServer);

    return [...secretBased, jiraItem];
  }, [secretListWatch.data.array, jiraServerListWatch.data.array]);

  const isLoading =
    (secretListWatch.query.isFetching && !secretListWatch.query.data) ||
    (jiraServerListWatch.query.isFetching && !jiraServerListWatch.query.data);

  const [expanded, setExpanded] = useState(false);

  const configured = integrations.filter((i) => i.status !== "not-configured");
  const unhealthy = configured.filter((i) => i.status === "error" || i.status === "unknown");
  const allHealthy = configured.length > 0 && unhealthy.length === 0;

  return (
    <DashboardCard title="Integrations" icon={Plug} iconColor={MAIN_COLOR.BLUE}>
      {isLoading ? (
        <LoadingState className="py-4" />
      ) : configured.length === 0 ? (
        <p className="text-muted-foreground py-2 text-sm">No integrations configured</p>
      ) : allHealthy ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="flex w-full items-center justify-between rounded-lg p-2"
            style={{ backgroundColor: `${STATUS_COLOR.SUCCESS}12` }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="size-4 shrink-0" style={{ color: STATUS_COLOR.SUCCESS }} />
              <span className="text-sm" style={{ color: STATUS_COLOR.SUCCESS }}>
                All {configured.length} integrations healthy
              </span>
            </div>
            <ChevronDown
              className="size-4 shrink-0 transition-transform"
              style={{
                color: STATUS_COLOR.SUCCESS,
                transform: expanded ? "rotate(180deg)" : undefined,
              }}
            />
          </button>
          {expanded && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 px-1">
              {configured.map((integration) => (
                <div key={integration.name} className="flex items-center gap-1.5 py-0.5">
                  <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: STATUS_COLOR.SUCCESS }} />
                  <span className="text-muted-foreground text-xs">{integration.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div
            className="flex items-center gap-2 rounded-lg p-2"
            style={{ backgroundColor: `${STATUS_COLOR.ERROR}12` }}
          >
            <AlertTriangle className="size-4 shrink-0" style={{ color: STATUS_COLOR.ERROR }} />
            <span className="text-sm" style={{ color: STATUS_COLOR.ERROR }}>
              {unhealthy.length} of {configured.length} need attention
            </span>
          </div>
          {unhealthy.map((integration) => (
            <div key={integration.name} className="flex items-center justify-between rounded-md border px-3 py-2">
              <div className="flex items-center gap-2">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor: integration.status === "error" ? STATUS_COLOR.ERROR : STATUS_COLOR.UNKNOWN,
                  }}
                />
                <span className="text-foreground text-sm">{integration.name}</span>
                {integration.errorMessage && (
                  <Tooltip title={integration.errorMessage}>
                    <span className="max-w-[120px] truncate text-xs" style={{ color: STATUS_COLOR.ERROR }}>
                      {integration.errorMessage}
                    </span>
                  </Tooltip>
                )}
              </div>
              <Link to={integration.configPath} params={{ clusterName }}>
                <Button variant="ghost" size="sm" className="text-primary h-auto p-0 text-xs">
                  Fix
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
