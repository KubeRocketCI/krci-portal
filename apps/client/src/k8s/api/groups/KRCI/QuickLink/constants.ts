import { systemQuickLink } from "@my-project/shared";

export const quickLinkUiNames = {
  [systemQuickLink.argocd]: "Argo CD",
  [systemQuickLink.monitoring]: "Monitoring",
  [systemQuickLink.logging]: "Logging",
  [systemQuickLink.sonar]: "Sonar",
} as const;
