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
export function SidebarMenuContent({ parentNavItem, parentGroupId, onNavigate }: SidebarMenuContentProps) {
  return (
    <>
      {parentNavItem.children.map((child) => {
        if ("route" in child && child.route) {
          return (
            <SidebarMenuItem
              key={child.title}
              item={child as SimpleNavItem}
              parentGroupId={parentGroupId}
              onNavigate={onNavigate}
            />
          );
        }

        return (
          <SidebarSubGroupMenuItem
            key={child.title}
            subGroup={child as NavSubGroupItem}
            parentGroupId={parentGroupId}
            onNavigate={onNavigate}
          />
        );
      })}
    </>
  );
}
