import { useCallback } from "react";
import { usePinnedItems } from "@/core/hooks/usePinnedItems";
import { createPinConfig } from "./utils";
import type { SimpleNavItem } from "./types";

/**
 * Shared pin/unpin state for a sidebar nav row: builds the pin config from the
 * item, reads its pinned state, and exposes a click handler that swallows the
 * navigation event before toggling.
 */
export function usePinToggle(item: Pick<SimpleNavItem, "title" | "route">) {
  const { isPinned, togglePin } = usePinnedItems();
  const pinConfig = createPinConfig(item.title, item.route);
  const pinned = isPinned(pinConfig.key);

  const handlePin = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      togglePin(pinConfig);
    },
    [togglePin, pinConfig]
  );

  return { pinned, handlePin };
}
