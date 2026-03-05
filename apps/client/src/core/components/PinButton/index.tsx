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
    <Tooltip title={pinned ? "Unpin from sidebar" : "Pin to sidebar"}>
      <Button
        onClick={() => togglePin(pinConfig)}
        variant="ghost"
        size="icon-xs"
        className="min-w-0 shrink-0 items-center rounded p-1 opacity-60 transition-all hover:bg-slate-100 hover:opacity-100"
        aria-label={pinned ? "Unpin from sidebar" : "Pin to sidebar"}
      >
        <Pin width={13} height={13} className={pinned ? "fill-current text-blue-600" : "text-slate-500"} />
      </Button>
    </Tooltip>
  );
}
