import { ArrowDown, Zap, Pause } from "lucide-react";
import { StageTriggerType } from "@my-project/shared";

interface EnvironmentFlowArrowProps {
  triggerType: StageTriggerType;
}

export const EnvironmentFlowArrow = ({ triggerType }: EnvironmentFlowArrowProps) => {
  const triggerTypeLower = triggerType.toLowerCase();
  const isAuto = triggerTypeLower === "auto" || triggerTypeLower === "auto-stable";

  return (
    <div className="flex justify-center py-4">
      <div className="flex flex-col items-center gap-2">
        <div
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
            isAuto
              ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
              : "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-400"
          }`}
        >
          {isAuto ? (
            <>
              <Zap className="size-3" />
              <span>Auto Promote</span>
            </>
          ) : (
            <>
              <Pause className="size-3" />
              <span>Manual Promote</span>
            </>
          )}
        </div>
        <ArrowDown className="text-muted-foreground size-6" />
      </div>
    </div>
  );
};
