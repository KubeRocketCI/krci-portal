import { useCallback } from "react";
import { Link, useMatches } from "@tanstack/react-router";
import { ChevronRight, Pin, PinOff } from "lucide-react";
import { SidebarMenuAction, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub } from "../ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { cn } from "../../utils/classname";
import { SidebarMenuContent } from "./SidebarMenuContent";
import { usePinnedItems } from "@/core/hooks/usePinnedItems";
import { createPinConfig } from "./utils";
import type { NavItem, SimpleNavItem, NavSubGroupItem, NavGroupItem } from "./types";
import type { RouteParams } from "@/core/router/types";

interface SidebarMenuItemWithHoverProps {
  item: NavItem;
  isMenuOpen: (groupId: string) => boolean;
  onToggle: (groupId: string) => void;
  onOpenMenu: (groupId: string) => void;
  onNavigate: (groupId?: string) => void;
  isMinimized?: boolean;
}

/**
 * Component for rendering sidebar menu items with hover effects and collapsible behavior
 * Handles both simple nav items and groups with children
 */
export const SidebarMenuItemWithHover = ({
  item,
  isMenuOpen,
  onToggle,
  onOpenMenu,
  onNavigate,
  isMinimized = false,
}: SidebarMenuItemWithHoverProps) => {
  const matches = useMatches();

  const getFirstMenuItemRoute = (children: (SimpleNavItem | NavSubGroupItem)[]): RouteParams => {
    for (const child of children) {
      if ("route" in child && child.route) {
        // This is a simple nav item
        return {
          to: child.route.to,
          params: child.route.params,
        };
      } else if ("children" in child && child.children.length > 0) {
        // This is a sub-group, get the first item from its children
        return {
          to: child.children[0].route.to,
          params: child.children[0].route.params,
        };
      }
    }
    return { to: "/" };
  };

  // Always call hooks at the top level
  const { isPinned, togglePin } = usePinnedItems();

  // For items with children, prefer groupRoute.id, fallback to title
  const groupId =
    ("groupRoute" in item && item.groupRoute?.id) || ("children" in item && item.children ? item.title : "");
  const isOpen = isMenuOpen(groupId);

  // Calculate pin config for simple items (at top level to satisfy hooks rules)
  const isSimpleItem = "route" in item && item.route;
  const simpleItem = isSimpleItem ? (item as SimpleNavItem) : null;
  const pinConfig = simpleItem ? createPinConfig(simpleItem.title, simpleItem.route) : null;
  const pinned = pinConfig ? isPinned(pinConfig.key) : false;

  const handleToggle = useCallback(() => {
    if (groupId) {
      onToggle(groupId);
    }
  }, [groupId, onToggle]);

  const handleSimpleNavClick = useCallback(() => {
    onNavigate(); // Close all menus for top-level nav items
  }, [onNavigate]);

  // Handle group button click - should navigate and open menu
  const handleGroupButtonClick = useCallback(() => {
    onNavigate(groupId);
    // Only open submenu if not minimized
    if (!isMinimized) {
      onOpenMenu(groupId);
    }
  }, [onNavigate, groupId, onOpenMenu, isMinimized]);

  const handlePin = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (pinConfig) {
        togglePin(pinConfig);
      }
    },
    [togglePin, pinConfig]
  );

  if (isSimpleItem && simpleItem) {
    // Simple menu item without children - use existing pattern

    return (
      <SidebarMenuItem key={simpleItem.title}>
        <SidebarMenuButton asChild tooltip={simpleItem.title} className="p-2">
          <Link
            to={simpleItem.route.to}
            params={simpleItem.route.params}
            onClick={handleSimpleNavClick}
            activeProps={{
              className: "text-accent-foreground border-l-2 border-primary bg-accent",
            }}
          >
            {({ isActive }: { isActive: boolean }) => (
              <>
                {simpleItem.icon && (
                  <simpleItem.icon className={cn(isActive ? "text-foreground" : "text-sidebar-foreground")} />
                )}
                <span className={cn(isActive ? "text-foreground" : "text-sidebar-foreground")}>{simpleItem.title}</span>
              </>
            )}
          </Link>
        </SidebarMenuButton>
        <SidebarMenuAction
          showOnHover
          onClick={handlePin}
          aria-label={pinned ? `Unpin ${simpleItem.title}` : `Pin ${simpleItem.title}`}
        >
          {pinned ? <Pin className="size-3 fill-current text-blue-600" /> : <PinOff className="size-3" />}
        </SidebarMenuAction>
      </SidebarMenuItem>
    );
  }

  // Menu item with children - use Collapsible
  const groupItem = item as NavGroupItem;
  const firstChildRoute = getFirstMenuItemRoute(groupItem.children);
  const linkRoute = groupItem.defaultRoute || firstChildRoute;

  // Check if group should be active (if current route is under this group)
  const isGroupActive =
    groupItem.groupRoute && matches.some((match) => match.routeId.includes(groupItem.groupRoute?.id || ""));

  return (
    <SidebarMenuItem key={item.title}>
      <Collapsible open={isOpen && !isMinimized} onOpenChange={handleToggle}>
        <div className="relative">
          <SidebarMenuButton
            asChild
            tooltip={item.title}
            className={cn("p-2", isGroupActive && "text-accent-foreground border-primary bg-accent border-l-2")}
          >
            <Link
              to={linkRoute.to}
              params={linkRoute.params}
              onClick={handleGroupButtonClick}
              activeProps={{
                className: "text-accent-foreground border-l-2 border-primary bg-accent",
              }}
            >
              {({ isActive }: { isActive: boolean }) => {
                const shouldBeActive = isActive || isGroupActive;
                return (
                  <>
                    {item.icon && (
                      <item.icon className={cn(shouldBeActive ? "text-foreground" : "text-sidebar-foreground")} />
                    )}
                    <span className={cn(shouldBeActive ? "text-foreground" : "text-sidebar-foreground")}>
                      {item.title}
                    </span>
                  </>
                );
              }}
            </Link>
          </SidebarMenuButton>
          <CollapsibleTrigger asChild>
            <SidebarMenuAction
              className="!top-1/2 right-1 h-8 w-8 !-translate-y-1/2 data-[state=open]:rotate-90"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <ChevronRight className="h-5 w-5" />
              <span className="sr-only">Toggle</span>
            </SidebarMenuAction>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <SidebarMenuSub>
            <SidebarMenuContent parentNavItem={item as NavGroupItem} parentGroupId={groupId} onNavigate={onNavigate} />
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
};
