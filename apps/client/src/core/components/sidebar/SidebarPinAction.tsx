import { Pin, PinOff } from "lucide-react";
import { SidebarMenuAction } from "../ui/sidebar";
import { cn } from "@/core/utils/classname";

/**
 * Unified pin/unpin action button for sidebar rows.
 *
 * Wraps `SidebarMenuAction` to add two row-specific behaviors:
 *
 * 1. 12px icons — overrides the base `[&>svg]:size-4` with `[&>svg]:size-3`.
 *
 * 2. Scope-aware hover reveal — the base `showOnHover` is hard-coded to the
 *    `group/menu-item` container, which reveals every sibling pin when a row
 *    lives in `group/menu-sub-item`. This applies reveal classes matched to the
 *    row's actual container via a static lookup keyed by `scope`.
 */

export type PinScope = "menu-item" | "menu-sub-item";

interface SidebarPinActionProps {
  title: string;
  pinned: boolean;
  /** Click handler; preventDefault / stopPropagation belong in the call site. */
  onToggle: (e: React.MouseEvent) => void;
  /**
   * Which group container the row lives in — selects the matching hover-reveal scope.
   * - "menu-item"     → `SidebarMenuItem`      (`group/menu-item`)
   * - "menu-sub-item" → `SidebarMenuSubItem`   (`group/menu-sub-item`)
   */
  scope: PinScope;
  className?: string;
}

/**
 * Scope-keyed reveal classes. Values are complete Tailwind class strings so the
 * scanner can extract them — never computed from the `scope` variable at runtime.
 */
const REVEAL_CLASSES: Record<PinScope, string> = {
  "menu-item":
    "md:opacity-0 group-hover/menu-item:opacity-100 group-focus-within/menu-item:opacity-100 data-[state=open]:opacity-100",
  "menu-sub-item":
    "md:opacity-0 group-hover/menu-sub-item:opacity-100 group-focus-within/menu-sub-item:opacity-100 data-[state=open]:opacity-100",
};

export function SidebarPinAction({ title, pinned, onToggle, scope, className }: SidebarPinActionProps) {
  return (
    <SidebarMenuAction
      onClick={onToggle}
      aria-label={pinned ? `Unpin ${title}` : `Pin ${title}`}
      className={cn(
        // Force 12px icons over the base [&>svg]:size-4.
        "[&>svg]:size-3",
        // Unpinned pins reveal only on row hover/focus; pinned pins stay visible.
        !pinned && REVEAL_CLASSES[scope],
        className
      )}
    >
      {pinned ? <Pin className="fill-current text-blue-600" /> : <PinOff />}
    </SidebarMenuAction>
  );
}
