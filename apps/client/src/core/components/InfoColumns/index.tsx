import React from "react";
import { InfoColumnsProps } from "./types";
import { UseSpriteSymbol } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";

export const InfoColumns = ({ infoRows }: InfoColumnsProps) => {
  return (
    <div className="grid grid-cols-1 gap-4">
      {infoRows.map((row, index) => (
        <div key={`row::${index}`}>
          <div className="grid grid-cols-12 gap-2">
            {row.map(({ label, text, icon, columnXs = 2 }, index) => (
              <React.Fragment key={`column::${index}`}>
                {!!label && !!text && (
                  <div className={`col-span-${columnXs}`}>
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
};
