import { Stack, Tooltip } from "@mui/material";
import { Info } from "lucide-react";

export const ValuesOverridePreviewHeadColumn = () => {
  return (
    <Stack direction="row" spacing={1} alignItems="center" flexWrap="nowrap">
      <div>Values override</div>
      <Tooltip title={"Override default deployment settings with custom configurations."}>
        <Info size={16} />
      </Tooltip>
    </Stack>
  );
};
