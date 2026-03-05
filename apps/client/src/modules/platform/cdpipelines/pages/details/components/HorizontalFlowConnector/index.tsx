import { ChevronRight, Zap, Pause } from "lucide-react";
import { StageTriggerType } from "@my-project/shared";

interface HorizontalFlowConnectorProps {
  triggerType: StageTriggerType;
}

export function HorizontalFlowConnector({ triggerType }: HorizontalFlowConnectorProps) {
  const triggerTypeLower = triggerType.toLowerCase();
  const isAuto = triggerTypeLower === "auto" || triggerTypeLower === "auto-stable";

  return (
    <div className="flex flex-shrink-0 items-center px-2">
      <div className="flex items-center gap-1">
        <div className="bg-border h-px w-6" />
        <div
          className={`flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${
            isAuto
              ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
              : "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-400"
          }`}
        >
          {isAuto ? <Zap className="size-3" /> : <Pause className="size-3" />}
          <span className="whitespace-nowrap">{isAuto ? "Auto" : "Manual"}</span>
        </div>
        <div className="bg-border h-px w-2" />
        <ChevronRight className="text-muted-foreground size-4" />
      </div>
    </div>
  );
}
