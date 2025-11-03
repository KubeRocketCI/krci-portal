import { Tooltip } from "@mui/material";
import React from "react";
import { SectionProps } from "./types";
import { CopyButton } from "../CopyButton";
import { Info } from "lucide-react";

export const Section: React.FC<SectionProps> = ({ title, titleTooltip, enableCopyTitle, description, children }) => {
  return (
    <div className="flex grow flex-col gap-8">
      <div className="flex flex-col gap-2">
        {title && (
          <div className="flex flex-row items-center gap-0">
            {typeof title === "string" ? <h2 className="text-foreground text-4xl">{title}</h2> : title}
            {titleTooltip && (
              <Tooltip title={titleTooltip}>
                <Info size={15} />
              </Tooltip>
            )}
            {enableCopyTitle && typeof title === "string" && <CopyButton text={title} />}
          </div>
        )}
        {description && <p className="text-base">{description}</p>}
      </div>

      <div className="mt-4 flex grow flex-col">{children}</div>
    </div>
  );
};
