import { useCallback, useEffect, useMemo, useState } from "react";
import type { useMatches } from "@tanstack/react-router";
import { useSidebar } from "../components/ui/sidebar";
import type { NavItem } from "../components/sidebar/types";

/**
 * Custom hook for managing sidebar menu state
 * Handles automatic menu opening/closing based on current route and sidebar state
 */
export function useSidebarMenu(nav: NavItem[], routerMatches: ReturnType<typeof useMatches>) {
  const { state: sidebarState } = useSidebar();

  const activeMenuGroup = useMemo(() => {
    return nav.find((item) => {
      if (!("groupRoute" in item) || !item.groupRoute) return false;
      return routerMatches.some((match) => match.routeId.includes(item.groupRoute?.id || ""));
    });
  }, [nav, routerMatches]);

  const [openMenuGroupId, setOpenMenuGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (sidebarState === "collapsed") {
      setOpenMenuGroupId(null);
      return;
    }

    setOpenMenuGroupId(activeMenuGroup?.groupRoute?.id || null);
  }, [activeMenuGroup?.groupRoute?.id, sidebarState]);

  const toggleMenu = useCallback((groupId: string) => {
    setOpenMenuGroupId((prev) => (prev === groupId ? null : groupId));
  }, []);

  const openMenu = useCallback((groupId: string) => {
    setOpenMenuGroupId(groupId);
  }, []);

  const closeMenusExcept = useCallback(
    (keepOpenGroupId?: string) => {
      if (openMenuGroupId !== keepOpenGroupId) {
        setOpenMenuGroupId(keepOpenGroupId || null);
      }
    },
    [openMenuGroupId]
  );

  return {
    toggleMenu,
    openMenu,
    closeMenusExcept,
    isMenuOpen: (groupId: string) => openMenuGroupId === groupId,
  };
}
