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
        <div className="bg-card flex gap-5 rounded-lg px-6 py-5 shadow-sm">
          <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg">
            <Icon className="text-primary size-5" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
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
                    {pinConfig && <PinButton pinConfig={pinConfig} />}
                  </div>
                )}
                {description && <p className="text-muted-foreground">{description}</p>}
              </div>
              {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
            </div>
            {extraContent && <div className="mt-3">{extraContent}</div>}
          </div>
        </div>
      )}

      <div className="flex grow flex-col">{children}</div>
    </div>
  );
};
