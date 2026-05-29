import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/core/components/ui/collapsible";
import { SidebarMenuSubButton, SidebarMenuSubItem } from "../ui/sidebar";
import { cn } from "@/core/utils/classname";
import type { NavCollapsibleSubGroupItem } from "./types";

interface Props {
  subGroup: NavCollapsibleSubGroupItem;
  parentGroupId?: string;
  onNavigate?: (groupId?: string) => void;
}

export function SidebarCollapsibleSubGroupMenuItem({ subGroup, parentGroupId, onNavigate }: Props) {
  const { pathname } = useLocation();
  const hasActiveChild = subGroup.children.some((c) => c.isActiveFn?.(pathname));
  // Open by default if the user has navigated into this subgroup, or if explicitly configured.
  const [open, setOpen] = useState(hasActiveChild || (subGroup.defaultOpen ?? false));

  // If a navigation makes a child active while the subgroup was collapsed, expand it.
  // `open` is intentionally omitted from deps: React bails out of setState(true) when
  // already true, so the guard is implicit. Including `open` would re-run the effect
  // on every user toggle for no behavior change.
  useEffect(() => {
    if (hasActiveChild) setOpen(true);
  }, [hasActiveChild]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          aria-expanded={open}
          title={subGroup.title}
          className={cn(
            "hover:bg-accent hover:text-accent-foreground mb-1 flex w-full min-w-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium tracking-wider uppercase",
            hasActiveChild ? "text-accent-foreground bg-accent/60" : "text-muted-foreground"
          )}
        >
          {open ? <ChevronDown className="size-3 shrink-0" /> : <ChevronRight className="size-3 shrink-0" />}
          <span className="min-w-0 flex-1 truncate text-left">{subGroup.title}</span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {subGroup.children.map((child) => (
          <SidebarMenuSubItem key={child.title}>
            <SidebarMenuSubButton asChild size="sm">
              <Link
                to={child.route.to}
                params={child.route.params}
                onClick={() => onNavigate?.(parentGroupId)}
                activeOptions={{ exact: true, includeSearch: false }}
                activeProps={{ className: "bg-accent text-accent-foreground" }}
                title={child.title}
                className={cn("min-w-0", child.isActiveFn?.(pathname) && "bg-accent text-accent-foreground")}
              >
                {child.icon && <child.icon className="size-4 shrink-0" />}
                <span className="min-w-0 flex-1 truncate">{child.title}</span>
              </Link>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
