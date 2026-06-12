import { useCallback } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { SidebarMenuSubButton, SidebarMenuSubItem } from "../ui/sidebar";
import { cn } from "@/core/utils/classname";
import { usePinToggle } from "./usePinToggle";
import { SidebarPinAction } from "./SidebarPinAction";
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
  const { pathname } = useLocation();
  const { pinned, handlePin } = usePinToggle(item);
  const isActiveFnMatch = item.isActiveFn?.(pathname) ?? false;

  const handleClick = useCallback(() => {
    onNavigate?.(parentGroupId);
  }, [onNavigate, parentGroupId]);

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild className={cn(isActiveFnMatch && "bg-accent text-accent-foreground")}>
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
