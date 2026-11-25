import { useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { SidebarNavGroup } from "@/core/components/sidebar/SidebarNavGroup";
import { createFactoryNavigationConfig } from "../../constants/nav";

export function FactorySidebar({ isMinimized }: { isMinimized: boolean }) {
  const { clusterName } = useParams({ strict: false }) as { clusterName?: string };
  const nav = useMemo(() => (clusterName ? createFactoryNavigationConfig(clusterName) : []), [clusterName]);

  if (!clusterName) return null;

  return <SidebarNavGroup label="Factory" nav={nav} isMinimized={isMinimized} />;
}
