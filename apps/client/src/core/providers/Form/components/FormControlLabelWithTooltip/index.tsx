import { Tooltip } from "@mui/material";
import { Info } from "lucide-react";
import { FormControlLabelWithTooltipProps } from "./types";

export const FormControlLabelWithTooltip = ({ label, title, disabled }: FormControlLabelWithTooltipProps) => {
  return (
    <span className={`flex items-center gap-2 ${disabled ? "text-muted-foreground opacity-50" : ""}`}>
      <span className={`text-sm leading-none ${disabled ? "text-muted-foreground" : "text-foreground"}`}>
        {label}
      </span>
      {title ? (
        <Tooltip title={title}>
          <Info size={16} />
        </Tooltip>
      ) : (
        <div className="h-5" />
      )}
    </span>
  );
};
