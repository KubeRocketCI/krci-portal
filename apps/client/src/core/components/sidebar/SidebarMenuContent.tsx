import { SidebarMenuItem } from "./SidebarMenuItem";
import { SidebarSubGroupMenuItem } from "./SidebarSubGroupMenuItem";
import type { NavGroupItem, SimpleNavItem, NavSubGroupItem } from "./types";

interface SidebarMenuContentProps {
  parentNavItem: NavGroupItem;
  parentGroupId?: string;
  onNavigate?: (groupId?: string) => void;
}

/**
 * Component for rendering the content of a sidebar menu group
 * Handles both simple nav items and sub-groups
 */
export const SidebarMenuContent = ({ parentNavItem, parentGroupId, onNavigate }: SidebarMenuContentProps) => {
  return parentNavItem.children.map((child) => {
    // Check if this child is a simple nav item or a sub-group
    if ("route" in child && child.route) {
      // This is a simple nav item
      return (
        <SidebarMenuItem
          key={child.title}
          item={child as SimpleNavItem}
          parentGroupId={parentGroupId}
          onNavigate={onNavigate}
        />
      );
    } else {
      // This is a sub-group
      return (
        <SidebarSubGroupMenuItem
          key={child.title}
          subGroup={child as NavSubGroupItem}
          parentGroupId={parentGroupId}
          onNavigate={onNavigate}
        />
      );
    }
  });
};
