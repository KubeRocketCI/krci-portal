import { useCallback, useEffect, useMemo, useState } from "react";
import type { useMatches } from "@tanstack/react-router";
import { useLocation } from "@tanstack/react-router";
import { useSidebar } from "../components/ui/sidebar";
import type { NavGroupItem, NavItem } from "../components/sidebar/types";
import { isNavGroupActiveForPathname } from "../components/sidebar/utils";

/**
 * Custom hook for managing sidebar menu state
 * Handles automatic menu opening/closing based on current route and sidebar state
 */
export function useSidebarMenu(nav: NavItem[], routerMatches: ReturnType<typeof useMatches>) {
  const { state: sidebarState } = useSidebar();
  const { pathname } = useLocation();

  const activeMenuGroup = useMemo(() => {
    return nav.find((item) => {
      if (!("children" in item) || !item.children) return false;
      const groupItem = item as NavGroupItem;

      if (groupItem.groupRoute) {
        if (routerMatches.some((match) => match.routeId.includes(groupItem.groupRoute?.id || ""))) {
          return true;
        }
      }

      return isNavGroupActiveForPathname(groupItem, pathname);
    });
  }, [nav, routerMatches, pathname]);

  const [openMenuGroupId, setOpenMenuGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (sidebarState === "collapsed") {
      setOpenMenuGroupId(null);
      return;
    }

    const groupItem = activeMenuGroup as NavGroupItem | undefined;
    const activeId = groupItem ? (groupItem.groupRoute?.id ?? groupItem.title) : null;
    setOpenMenuGroupId(activeId);
  }, [activeMenuGroup, sidebarState]);

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
