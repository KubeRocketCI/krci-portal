import { Tooltip } from "@/core/components/ui/tooltip";
import { Info } from "lucide-react";

export const ValuesOverridePreviewHeadColumn = () => {
  return (
    <div className="flex flex-row flex-nowrap items-center gap-2">
      <div>Values override</div>
      <Tooltip title={"Override default deployment settings with custom configurations."}>
        <Info size={16} />
      </Tooltip>
    </div>
  );
};
