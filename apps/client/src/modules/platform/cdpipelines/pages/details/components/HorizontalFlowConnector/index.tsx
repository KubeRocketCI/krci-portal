import { ChevronRight, Zap, Pause } from "lucide-react";
import { StageTriggerType } from "@my-project/shared";
import { STATUS_COLOR } from "@/k8s/constants/colors";

interface HorizontalFlowConnectorProps {
  triggerType: StageTriggerType;
}

export function HorizontalFlowConnector({ triggerType }: HorizontalFlowConnectorProps) {
  const triggerTypeLower = triggerType.toLowerCase();
  const isAuto = triggerTypeLower === "auto" || triggerTypeLower === "auto-stable";

  const badgeColor = isAuto ? STATUS_COLOR.SUCCESS : STATUS_COLOR.SUSPENDED;

  return (
    <div className="flex flex-shrink-0 items-center px-2">
      <div className="flex items-center gap-1">
        <div className="bg-border h-px w-6" />
        <div
          className="flex items-center gap-1 rounded-full border px-2 py-1 text-xs"
          style={{
            color: badgeColor,
            borderColor: `${badgeColor}33`,
            backgroundColor: `${badgeColor}1A`,
          }}
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
