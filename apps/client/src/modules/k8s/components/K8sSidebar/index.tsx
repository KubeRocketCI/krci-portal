import { useMatches, useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { SidebarGroup, SidebarGroupLabel, SidebarMenu } from "@/core/components/ui/sidebar";
import { SidebarMenuItemWithHover } from "@/core/components/sidebar/SidebarMenuItemWithHover";
import { useSidebarMenu } from "@/core/hooks/useSidebarMenu";
import { createK8sNavigationConfig } from "../../constants/nav";
import { useCRSidebarItems } from "./useCRSidebarItems";

export function K8sSidebar({ isMinimized }: { isMinimized: boolean }) {
  const { clusterName } = useParams({ strict: false }) as { clusterName?: string };
  const matches = useMatches();

  // Show every registered kind in the sidebar. We intentionally do NOT gate visibility
  // on create/update/delete RBAC: most users only have list/get rights (no write verbs),
  // and the per-kind SelfSubjectAccessReview can error transiently for kinds the API
  // server returns 4xx on — both would hide kinds the user can actually browse.
  // The watchList call on the destination page surfaces 403s when the user truly lacks
  // list/get rights, so visibility is best handled there, not here.
  const crSidebarItems = useCRSidebarItems(clusterName ?? "");

  const nav = useMemo(
    () => (clusterName ? createK8sNavigationConfig(clusterName, crSidebarItems) : []),
    [clusterName, crSidebarItems]
  );
  const { isMenuOpen, toggleMenu, openMenu, closeMenusExcept } = useSidebarMenu(nav, matches);

  if (!clusterName) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Kubernetes</SidebarGroupLabel>
      <SidebarMenu>
        {nav.map((item) => (
          <SidebarMenuItemWithHover
            key={item.title}
            item={item}
            isMenuOpen={isMenuOpen}
            onToggle={toggleMenu}
            onOpenMenu={openMenu}
            onNavigate={closeMenusExcept}
            isMinimized={isMinimized}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
