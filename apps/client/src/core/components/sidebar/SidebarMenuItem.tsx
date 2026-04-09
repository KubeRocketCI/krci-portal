import { useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { Pin, PinOff } from "lucide-react";
import { SidebarMenuAction, SidebarMenuSubButton, SidebarMenuSubItem } from "../ui/sidebar";
import { usePinnedItems } from "@/core/hooks/usePinnedItems";
import { createPinConfig } from "./utils";
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
  const { isPinned, togglePin } = usePinnedItems();
  const pinConfig = createPinConfig(item.title, item.route);
  const pinned = isPinned(pinConfig.key);

  const handleClick = useCallback(() => {
    onNavigate?.(parentGroupId);
  }, [onNavigate, parentGroupId]);

  const handlePin = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      togglePin(pinConfig);
    },
    [togglePin, pinConfig]
  );

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
          {item.icon && <item.icon className="size-4" />}
          <span>{item.title}</span>
        </Link>
      </SidebarMenuSubButton>
      <SidebarMenuAction
        showOnHover
        onClick={handlePin}
        aria-label={pinned ? `Unpin ${item.title}` : `Pin ${item.title}`}
      >
        {pinned ? <Pin className="size-3 fill-current text-blue-600" /> : <PinOff className="size-3" />}
      </SidebarMenuAction>
    </SidebarMenuSubItem>
  );
};
