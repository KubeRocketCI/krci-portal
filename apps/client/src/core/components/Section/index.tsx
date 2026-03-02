import { Tooltip } from "@/core/components/ui/tooltip";
import React from "react";
import { SectionProps } from "./types";
import { CopyButton } from "../CopyButton";
import { PinButton } from "../PinButton";
import { Info } from "lucide-react";

export const Section: React.FC<SectionProps> = ({
  icon: Icon,
  title,
  titleTooltip,
  enableCopyTitle,
  pinConfig,
  description,
  actions,
  extraContent,
  children,
}) => {
  const hasHeader = title || description || actions;

  return (
    <div className="flex grow flex-col gap-6">
      {hasHeader && (
        <div className="bg-card flex gap-4 rounded-lg p-3 shadow-sm">
          <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
            <Icon className="text-primary size-4" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                {title && (
                  <div className="mb-1 flex flex-row items-center gap-1">
                    {typeof title === "string" ? (
                      <h1 className="text-foreground text-lg font-medium">{title}</h1>
                    ) : (
                      title
                    )}
                    {titleTooltip && (
                      <Tooltip title={titleTooltip}>
                        <Info size={15} />
                      </Tooltip>
                    )}
                    {enableCopyTitle && typeof title === "string" && <CopyButton text={title} />}
                    {pinConfig && <PinButton pinConfig={pinConfig} />}
                  </div>
                )}
                {description && <p className="text-muted-foreground text-xs">{description}</p>}
              </div>
              {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
            </div>
            {extraContent && <div className="mt-1">{extraContent}</div>}
          </div>
        </div>
      )}

      <div className="flex grow flex-col">{children}</div>
    </div>
  );
};
