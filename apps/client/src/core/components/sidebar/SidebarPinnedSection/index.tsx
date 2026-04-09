import { useCallback, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, PinOff, Pin as PinIcon, Box } from "lucide-react";
import { PAGE_ICONS } from "@/core/constants/page-icons";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  useSidebar,
} from "../../ui/sidebar";
import { usePinnedItems } from "@/core/hooks/usePinnedItems";
import type { PinnedPage } from "@/core/hooks/usePinnedItems";
import { cn } from "@/core/utils/classname";

export function SidebarPinnedSection() {
  const [open, setOpen] = useState(true);
  const { state: sidebarState } = useSidebar();
  const { pinnedPages, togglePin } = usePinnedItems();

  const isEmpty = pinnedPages.length === 0;
  const isSidebarCollapsed = sidebarState === "collapsed";

  return (
    <SidebarGroup className="pb-0" data-tour="pinned-section">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel className="hover:text-foreground cursor-pointer select-none">
            <PinIcon className="mr-1 size-3.5" />
            Pinned
            <ChevronDown className={cn("ml-auto size-4 transition-transform duration-200", !open && "-rotate-90")} />
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenu data-tour="sidebar-menu">
            {isEmpty && !isSidebarCollapsed && (
              <SidebarMenuItem>
                <div className="text-muted-foreground px-2 py-1.5 text-xs">Pin items from detail pages</div>
              </SidebarMenuItem>
            )}
            {pinnedPages.map((page) => (
              <PinnedPageItem key={page.key} page={page} onUnpin={() => togglePin(page)} />
            ))}
          </SidebarMenu>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
}

interface PinnedPageItemProps {
  page: PinnedPage;
  onUnpin: () => void;
}

function PinnedPageItem({ page, onUnpin }: PinnedPageItemProps) {
  const handleUnpin = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onUnpin();
    },
    [onUnpin]
  );

  // Get icon from iconType, fallback to type (for backwards compatibility), or Box
  const iconKey = page.iconType || page.type;
  const Icon = (iconKey && PAGE_ICONS[iconKey as keyof typeof PAGE_ICONS]) || Box;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild className="p-2" tooltip={page.label}>
        <Link
          to={page.route.to}
          params={page.route.params}
          activeProps={{
            className: "text-accent-foreground border-l-2 border-primary bg-accent",
          }}
        >
          {({ isActive }) => (
            <>
              <Icon className={cn("size-4", isActive ? "text-foreground" : "text-sidebar-foreground")} />
              <span className={cn("truncate", isActive ? "text-foreground" : "text-sidebar-foreground")}>
                {page.label}
              </span>
            </>
          )}
        </Link>
      </SidebarMenuButton>
      <SidebarMenuAction showOnHover onClick={handleUnpin} aria-label={`Unpin ${page.label}`}>
        <PinOff className="size-3" />
      </SidebarMenuAction>
    </SidebarMenuItem>
  );
}
