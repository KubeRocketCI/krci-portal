import type { Application, QuickLink, Stage } from "@my-project/shared";

export interface StageDeploymentCardsProps {
  stages: Stage[];
  getArgoApp: (stageName: string) => Application | undefined;
  deployedCount: number;
  pipelineName: string;
  namespace: string;
  appName: string;
  clusterName: string;
  argocdBaseURL: string | undefined;
  argocdQuickLink: QuickLink | undefined;
  onOpenLogs: (params: { namespace: string; appName: string }) => void;
  onOpenTerminal: (params: { namespace: string; appName: string }) => void;
}
