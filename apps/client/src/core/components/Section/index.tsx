import { Tooltip } from "@mui/material";
import React from "react";
import { SectionProps } from "./types";
import { CopyButton } from "../CopyButton";
import { Info } from "lucide-react";

export const Section: React.FC<SectionProps> = ({ title, titleTooltip, enableCopyTitle, description, children }) => {
  return (
    <div className="flex flex-col gap-8 grow">
      <div className="flex flex-col gap-2">
        {title && (
          <div className="flex flex-row gap-0 items-center">
            {typeof title === "string" ? (
              <h2 className="text-4xl text-foreground">
                {title}
              </h2>
            ) : (
              title
            )}
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

      <div className="flex flex-col grow mt-4">
        {children}
      </div>
    </div>
  );
};
