import { Tooltip } from "@/core/components/ui/tooltip";
import React from "react";
import { SubSectionProps } from "./types";
import { CopyButton } from "../CopyButton";
import { Info } from "lucide-react";

export const SubSection: React.FC<SubSectionProps> = ({
  title,
  titleTooltip,
  enableCopyTitle,
  description,
  actions,
  children,
}) => {
  const hasHeader = title || description || actions;

  return (
    <div className="flex grow flex-col gap-6">
      {hasHeader && (
        <div className="bg-card rounded-lg px-6 py-5 shadow-sm">
          <div className="flex items-start justify-between gap-6">
            <div className="flex flex-col">
              {title && (
                <div className="mb-2 flex flex-row items-center gap-0">
                  {typeof title === "string" ? (
                    <h1 className="text-foreground text-2xl font-medium">{title}</h1>
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
              {description && <p className="text-muted-foreground">{description}</p>}
            </div>
            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
          </div>
        </div>
      )}

      <div className="flex grow flex-col">{children}</div>
    </div>
  );
};
