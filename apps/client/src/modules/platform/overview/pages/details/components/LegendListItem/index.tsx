import React from "react";

export const LegendListItem = ({ color, number, label }: { color: string; number: number; label: string }) => {
  return (
    <div className="flex flex-row items-center gap-2">
      <div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-base font-medium text-foreground">
        {number}
      </span>
      <span className="text-base text-muted-foreground">
        {label}
      </span>
    </div>
  );
};
