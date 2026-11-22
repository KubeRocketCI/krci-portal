import { useMatches } from "@tanstack/react-router";
import { SidebarGroup, SidebarGroupLabel, SidebarMenu } from "../ui/sidebar";
import { useSidebarMenu } from "../../hooks/useSidebarMenu";
import { SidebarMenuItemWithHover } from "./SidebarMenuItemWithHover";
import type { NavItem } from "./types";

interface SidebarNavGroupProps {
  label: string;
  /** Memoize: the open menu group is recomputed when `nav` changes. */
  nav: NavItem[];
  isMinimized: boolean;
}

export function SidebarNavGroup({ label, nav, isMinimized }: SidebarNavGroupProps) {
  const matches = useMatches();
  const { isMenuOpen, toggleMenu, openMenu, closeMenusExcept } = useSidebarMenu(nav, matches);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
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
