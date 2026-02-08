import { useCallback, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Box, ChevronDown, CloudUpload, Layers, PinOff, Pin as PinIcon, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
} from "../../ui/sidebar";
import { usePinnedItems } from "@/core/hooks/usePinnedItems";
import type { PinnedPage, PinnedPageType } from "@/core/hooks/usePinnedItems";

const PIN_TYPE_ICONS: Record<PinnedPageType, LucideIcon> = {
  project: Box,
  deployment: CloudUpload,
  stage: Layers,
  "sca-project": Shield,
  "sast-project": Shield,
};
import { cn } from "@/core/utils/classname";

export function SidebarPinnedSection() {
  const [open, setOpen] = useState(true);
  const { pinnedPages, togglePin } = usePinnedItems();

  const isEmpty = pinnedPages.length === 0;

  return (
    <SidebarGroup className="pb-0">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel className="hover:text-foreground cursor-pointer select-none">
            <PinIcon className="mr-1 size-3.5" />
            Pinned
            <ChevronDown className={cn("ml-auto size-4 transition-transform duration-200", !open && "-rotate-90")} />
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenu>
            {isEmpty && (
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

  const Icon = PIN_TYPE_ICONS[page.type];

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild className="p-2">
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
