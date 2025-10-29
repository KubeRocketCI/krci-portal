import { Tooltip } from "@mui/material";
import { Info } from "lucide-react";

export const ValuesOverridePreviewHeadColumn = () => {
  return (
    <div className="flex flex-row gap-2 items-center flex-nowrap">
      <div>Values override</div>
      <Tooltip title={"Override default deployment settings with custom configurations."}>
        <Info size={16} />
      </Tooltip>
    </div>
  );
};
