import { useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { SidebarMenuSubButton, SidebarMenuSubItem } from "../ui/sidebar";
import { usePinToggle } from "./usePinToggle";
import { SidebarPinAction } from "./SidebarPinAction";
import type { NavSubGroupItem } from "./types";

interface SidebarSubGroupMenuItemProps {
  subGroup: NavSubGroupItem;
  parentGroupId?: string;
  onNavigate?: (groupId?: string) => void;
}

interface SubGroupItemProps {
  item: NavSubGroupItem["children"][number];
  parentGroupId?: string;
  onNavigate?: (groupId?: string) => void;
}

/**
 * Component for rendering an individual item within a sub-group
 */
const SubGroupItem = ({ item, parentGroupId, onNavigate }: SubGroupItemProps) => {
  const { pinned, handlePin } = usePinToggle(item);

  const handleClick = useCallback(() => {
    onNavigate?.(parentGroupId);
  }, [onNavigate, parentGroupId]);

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild size="sm">
        <Link
          to={item.route.to}
          params={item.route.params}
          onClick={handleClick}
          activeOptions={{ exact: true, includeSearch: false }}
          activeProps={{
            className: "bg-accent text-accent-foreground",
          }}
        >
          {item.icon && <item.icon className="size-4" />}
          <span>{item.title}</span>
        </Link>
      </SidebarMenuSubButton>
      <SidebarPinAction scope="menu-sub-item" title={item.title} pinned={pinned} onToggle={handlePin} />
    </SidebarMenuSubItem>
  );
};

/**
 * Component for rendering a sub-group (second level with title and children)
 */
export const SidebarSubGroupMenuItem = ({ subGroup, parentGroupId, onNavigate }: SidebarSubGroupMenuItemProps) => {
  return (
    <div>
      {/* Sub-group header */}
      <div className="text-muted-foreground border-border mt-3 mb-2 border-b px-2 py-1.5 text-xs font-medium tracking-wider uppercase first:mt-1">
        {subGroup.title}
      </div>
      {/* Sub-group items */}
      {subGroup.children.map((childItem) => (
        <SubGroupItem key={childItem.title} item={childItem} parentGroupId={parentGroupId} onNavigate={onNavigate} />
      ))}
    </div>
  );
};
