import { useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { Pin, PinOff } from "lucide-react";
import { SidebarMenuAction, SidebarMenuSubButton, SidebarMenuSubItem } from "../ui/sidebar";
import { usePinnedItems } from "@/core/hooks/usePinnedItems";
import { createPinConfig } from "./utils";
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
      <SidebarMenuAction
        className="group-focus-within/menu-sub-item:opacity-100 group-hover/menu-sub-item:opacity-100 data-[state=open]:opacity-100 md:opacity-0"
        onClick={handlePin}
        aria-label={pinned ? `Unpin ${item.title}` : `Pin ${item.title}`}
      >
        {pinned ? <Pin className="size-3 fill-current text-blue-600" /> : <PinOff className="size-3" />}
      </SidebarMenuAction>
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
      <div className="text-muted-foreground border-border mt-3 mb-2 border-b px-2 py-1.5 text-[11px] font-medium tracking-wider uppercase first:mt-1">
        {subGroup.title}
      </div>
      {/* Sub-group items */}
      {subGroup.children.map((childItem) => (
        <SubGroupItem key={childItem.title} item={childItem} parentGroupId={parentGroupId} onNavigate={onNavigate} />
      ))}
    </div>
  );
};
