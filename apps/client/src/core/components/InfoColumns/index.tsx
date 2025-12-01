import React from "react";
import { InfoColumnsProps } from "./types";
import { UseSpriteSymbol } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { cn } from "@/core/utils/classname";

const colSpanClasses: Record<number, string> = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
  5: "col-span-5",
  6: "col-span-6",
  7: "col-span-7",
  8: "col-span-8",
  9: "col-span-9",
  10: "col-span-10",
  11: "col-span-11",
  12: "col-span-12",
};

export const InfoColumns = ({ infoRows, gridItems, className, gridCols = 4 }: InfoColumnsProps) => {
  // New grid-based layout
  if (gridItems) {
    const gridColsClasses: Record<number, string> = {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-4",
      5: "grid-cols-5",
      6: "grid-cols-6",
    };
    return (
      <div className={cn("grid gap-x-6 gap-y-4", gridColsClasses[gridCols] || "grid-cols-4", className)}>
        {gridItems.map((item, index) => (
          <div
            key={index}
            className={cn(
              item.colSpan === 1 && "col-span-1",
              item.colSpan === 2 && "col-span-2",
              item.colSpan === 3 && "col-span-3",
              item.colSpan === 4 && "col-span-4"
            )}
          >
            <div className="text-muted-foreground mb-1.5 text-xs">{item.label}</div>
            {item.content}
          </div>
        ))}
      </div>
    );
  }

  // Legacy row-based layout
  if (infoRows) {
    return (
      <div className={cn("grid grid-cols-1 gap-4", className)}>
        {infoRows.map((row, index) => (
          <div key={`row::${index}`}>
            <div className="grid grid-cols-12 gap-2">
              {row.map(({ label, text, icon, columnXs = 6 }, index) => (
                <React.Fragment key={`column::${index}`}>
                  {!!label && !!text && (
                    <div className={colSpanClasses[columnXs] || colSpanClasses[6]}>
                      <div className="text-foreground mb-1 text-sm font-medium">{label}</div>
                      <div className="grid grid-cols-[auto_1fr] items-center gap-1">
                        {!!icon && (
                          <div>
                            {typeof icon === "string" ? <UseSpriteSymbol name={icon} width={20} height={20} /> : icon}
                          </div>
                        )}
                        <div className="flex-1">
                          <span className="break-word text-muted-foreground text-sm">{text}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
};
