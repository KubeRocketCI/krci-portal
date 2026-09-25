import { useCallback } from "react";
import { usePinnedItems } from "@/core/hooks/usePinnedItems";
import { createPinTarget } from "./utils";
import type { SimpleNavItem } from "./types";

/**
 * Shared pin/unpin state for a sidebar nav row: builds the pin target from the
 * item, reads its pinned state, and exposes a click handler that swallows the
 * navigation event before toggling.
 */
export function usePinToggle(item: Pick<SimpleNavItem, "title" | "route">) {
  const { isPinned, togglePin } = usePinnedItems();
  const pinTarget = createPinTarget(item.title, item.route);
  const pinned = isPinned(pinTarget);

  const handlePin = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      togglePin(pinTarget);
    },
    [togglePin, pinTarget]
  );

  return { pinned, handlePin };
}
