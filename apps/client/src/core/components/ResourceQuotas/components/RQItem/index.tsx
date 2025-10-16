import React from "react";
import { entityMapping } from "../../constants";
import { RQItemProps } from "../../types";

export const RQItem: React.FC<RQItemProps> = ({ entity, details }) => {
  const { hard, used } = details;
  const loadPercentage = Math.floor(((used ?? 0) / (hard ?? 1)) * 100);

  const getQuotaColor = (percentage: number) => {
    if (percentage < 70) return "#10b981"; // green
    if (percentage < 90) return "#f59e0b"; // orange
    return "#ef4444"; // red
  };

  const color = getQuotaColor(loadPercentage);

  // Simple circle progress SVG
  const radius = 20;
  const stroke = 4;
  const circumference = (radius - stroke) * 2 * Math.PI;
  const strokeDashoffset = circumference - (loadPercentage / 100) * circumference;

  return (
    <div className="flex min-w-[100px] flex-col items-center gap-2">
      <div className="text-foreground text-sm font-medium whitespace-nowrap">
        {entityMapping?.[entity as keyof typeof entityMapping] || entity}
      </div>
      <div className="relative">
        <svg height={radius * 2} width={radius * 2} viewBox={`0 0 ${radius * 2} ${radius * 2}`}>
          <circle
            stroke="#e5e7eb"
            fill="transparent"
            strokeWidth={stroke}
            r={radius - stroke}
            cx={radius}
            cy={radius}
            transform={`rotate(-90 ${radius} ${radius})`}
          />
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + " " + circumference}
            style={{ strokeDashoffset }}
            r={radius - stroke}
            cx={radius}
            cy={radius}
            transform={`rotate(-90 ${radius} ${radius})`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold">{loadPercentage}%</div>
      </div>
      <div className="text-muted-foreground text-xs">
        {details?.["used_initial"]} / {details?.["hard_initial"]}
      </div>
    </div>
  );
};
