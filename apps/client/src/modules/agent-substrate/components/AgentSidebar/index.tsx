import { useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { SidebarNavGroup } from "@/core/components/sidebar/SidebarNavGroup";
import { createAgentNavigationConfig } from "../../constants/nav";

export function AgentSidebar({ isMinimized }: { isMinimized: boolean }) {
  const { clusterName } = useParams({ strict: false }) as { clusterName?: string };
  const nav = useMemo(() => (clusterName ? createAgentNavigationConfig(clusterName) : []), [clusterName]);

  if (!clusterName) return null;

  return <SidebarNavGroup label="Agent Substrate" nav={nav} isMinimized={isMinimized} />;
}
