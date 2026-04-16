import { ChevronRight, Zap, Pause } from "lucide-react";
import { StageTriggerType, stageTriggerType } from "@my-project/shared";
import { STATUS_COLOR } from "@/k8s/constants/colors";

interface HorizontalFlowConnectorProps {
  triggerType: StageTriggerType;
  isFirst?: boolean;
}

export function HorizontalFlowConnector({ triggerType, isFirst = false }: HorizontalFlowConnectorProps) {
  const isAuto = triggerType === stageTriggerType.Auto || triggerType === stageTriggerType["Auto-stable"];

  const badgeColor = isAuto ? STATUS_COLOR.SUCCESS : STATUS_COLOR.SUSPENDED;

  return (
    <div className="flex flex-shrink-0 items-center px-2">
      <div className="flex items-center gap-1">
        {!isFirst && <div className="bg-border h-px w-6" />}
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
