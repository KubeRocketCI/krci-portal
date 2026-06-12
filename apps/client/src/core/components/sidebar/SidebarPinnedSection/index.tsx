import { useCallback, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Pin as PinIcon, Box } from "lucide-react";
import { PAGE_ICONS } from "@/core/constants/page-icons";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "../../ui/sidebar";
import { usePinnedItems } from "@/core/hooks/usePinnedItems";
import type { PinnedPage } from "@/core/hooks/usePinnedItems";
import { getK8sPinnedPageIcon } from "@/modules/k8s/utils/pinned-icon";
import { cn } from "@/core/utils/classname";
import { SidebarPinAction } from "../SidebarPinAction";

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

  // Get icon from iconType, fallback to type (for backwards compatibility),
  // then to the K8s registry resolver (K8s routes are param-identified and
  // can't live in the static PAGE_ICONS map), or Box as the last resort.
  const iconKey = page.iconType || page.type;
  const Icon = (iconKey && PAGE_ICONS[iconKey as keyof typeof PAGE_ICONS]) || getK8sPinnedPageIcon(page) || Box;

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
      {/* Entries here are pinned by definition, so pinned={true} keeps the filled pin always visible. */}
      <SidebarPinAction scope="menu-item" title={page.label} pinned={true} onToggle={handleUnpin} />
    </SidebarMenuItem>
  );
}
