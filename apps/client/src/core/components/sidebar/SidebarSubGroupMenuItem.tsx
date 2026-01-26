import { useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { SidebarMenuSubButton, SidebarMenuSubItem } from "../ui/sidebar";
import type { NavSubGroupItem } from "./types";

interface SidebarSubGroupMenuItemProps {
  subGroup: NavSubGroupItem;
  parentGroupId?: string;
  onNavigate?: (groupId?: string) => void;
}

/**
 * Component for rendering a sub-group (second level with title and children)
 */
export const SidebarSubGroupMenuItem = ({ subGroup, parentGroupId, onNavigate }: SidebarSubGroupMenuItemProps) => {
  const handleClick = useCallback(() => {
    onNavigate?.(parentGroupId);
  }, [onNavigate, parentGroupId]);

  return (
    <div>
      {/* Sub-group header */}
      <div className="text-muted-foreground border-border mt-3 mb-2 border-b px-2 py-1.5 text-[11px] font-medium tracking-wider uppercase first:mt-1">
        {subGroup.title}
      </div>
      {/* Sub-group items */}
      {subGroup.children.map((childItem) => (
        <SidebarMenuSubItem key={childItem.title}>
          <SidebarMenuSubButton asChild size="sm">
            <Link
              to={childItem.route.to}
              params={childItem.route.params}
              onClick={handleClick}
              activeOptions={{ exact: true, includeSearch: false }}
              activeProps={{
                className: "bg-accent text-accent-foreground",
              }}
            >
              <span>{childItem.title}</span>
            </Link>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      ))}
    </div>
  );
};
