import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import { usePinnedItems } from "@/core/hooks/usePinnedItems";
import type { PinnedPage } from "@/core/hooks/usePinnedItems";
import { Pin } from "lucide-react";

interface PinButtonProps {
  pinConfig: PinnedPage;
}

export function PinButton({ pinConfig }: PinButtonProps) {
  const { isPinned, togglePin } = usePinnedItems();
  const pinned = isPinned(pinConfig.key);

  return (
    <div className="text-muted-foreground pt-[0.4%]">
      <Tooltip title={pinned ? "Unpin from sidebar" : "Pin to sidebar"}>
        <Button
          onClick={() => togglePin(pinConfig)}
          variant="ghost"
          size="sm"
          className="hover:bg-muted/80 min-w-0 shrink-0 p-0"
          aria-label={pinned ? "Unpin from sidebar" : "Pin to sidebar"}
        >
          <Pin size={15} className={pinned ? "text-primary fill-current" : ""} />
        </Button>
      </Tooltip>
    </div>
  );
}
