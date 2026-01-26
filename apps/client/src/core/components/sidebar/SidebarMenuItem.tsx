import { useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { SidebarMenuSubButton, SidebarMenuSubItem } from "../ui/sidebar";
import type { SimpleNavItem } from "./types";

interface SidebarMenuItemProps {
  item: SimpleNavItem;
  parentGroupId?: string;
  onNavigate?: (groupId?: string) => void;
}

/**
 * Component for rendering a simple nav item (just title and route)
 */
export const SidebarMenuItem = ({ item, parentGroupId, onNavigate }: SidebarMenuItemProps) => {
  const handleClick = useCallback(() => {
    onNavigate?.(parentGroupId);
  }, [onNavigate, parentGroupId]);

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild>
        <Link
          to={item.route.to}
          params={item.route.params}
          onClick={handleClick}
          activeOptions={{ exact: true, includeSearch: false }}
          activeProps={{
            className: "bg-accent text-accent-foreground",
          }}
        >
          <span>{item.title}</span>
        </Link>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
};
