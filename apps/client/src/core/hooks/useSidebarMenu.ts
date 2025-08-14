import { useCallback, useEffect, useMemo, useState } from "react";
import type { useMatches } from "@tanstack/react-router";
import { useSidebar } from "../components/ui/sidebar";
import type { NavItem } from "../components/sidebar/types";

/**
 * Custom hook for managing sidebar menu state
 * Handles automatic menu opening/closing based on current route and sidebar state
 */
export const useSidebarMenu = (nav: NavItem[], routerMatches: ReturnType<typeof useMatches>) => {
  const { state: sidebarState } = useSidebar();

  // Find the active menu group based on current route
  const activeMenuGroup = useMemo(() => {
    return nav.find((item) => {
      if (!("groupRoute" in item) || !item.groupRoute) return false;

      // Check if any current route matches or is a descendant of the group route
      return routerMatches.some((match) => {
        return match.routeId.includes(item.groupRoute?.id || "");
      });
    });
  }, [nav, routerMatches]);

  // State for which menu group should be open
  const [openMenuGroupId, setOpenMenuGroupId] = useState<string | null>(null);

  // Initialize and update menu state based on active group and sidebar state
  useEffect(() => {
    if (sidebarState === "collapsed") {
      setOpenMenuGroupId(null);
    } else if (sidebarState === "expanded") {
      // Always set to active group when sidebar is expanded, even if null
      setOpenMenuGroupId(activeMenuGroup?.groupRoute?.id || null);
    }
  }, [activeMenuGroup?.groupRoute?.id, sidebarState]);

  const toggleMenu = useCallback((groupId: string) => {
    setOpenMenuGroupId((prev) => (prev === groupId ? null : groupId));
  }, []);

  const openMenu = useCallback((groupId: string) => {
    setOpenMenuGroupId(groupId);
  }, []);

  const closeAllMenus = useCallback(() => {
    setOpenMenuGroupId(null);
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
    openMenuGroupId,
    toggleMenu,
    openMenu,
    closeAllMenus,
    closeMenusExcept,
    isMenuOpen: (groupId: string) => openMenuGroupId === groupId,
  };
};
