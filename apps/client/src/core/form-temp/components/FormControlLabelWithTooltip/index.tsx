import React from "react";
import { Tooltip } from "@/core/components/ui/tooltip";
import { Info } from "lucide-react";

export interface FormControlLabelWithTooltipProps {
  label: React.ReactNode;
  title?: React.ReactNode;
  disabled?: boolean;
}

export const FormControlLabelWithTooltip: React.FC<FormControlLabelWithTooltipProps> = ({
  label,
  title,
  disabled = false,
}) => {
  return (
    <span className={`flex items-center gap-2 ${disabled ? "text-muted-foreground opacity-50" : ""}`}>
      <span className={`text-sm leading-none ${disabled ? "text-muted-foreground" : "text-foreground"}`}>{label}</span>
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
