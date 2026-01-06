import { getRatingBgClass, getRatingTextClass, getCoverageColorClass, isDuplicationGood } from "../../../sast/utils";
import { INDICATOR_COLORS } from "../../../sast/constants";

interface MetricBadgeProps {
  rating?: string; // A-E rating or undefined
  value: string | number;
  label: string;
  type?: "rating" | "percentage" | "count";
}

/**
 * MetricBadge displays a SonarQube metric with optional rating badge
 */
export function MetricBadge({ rating, value, label, type = "rating" }: MetricBadgeProps) {
  const displayValue = typeof value === "number" && type === "percentage" ? `${value}%` : value;

  // For percentage type without rating (like Coverage, Duplications)
  if (type === "percentage" && !rating) {
    const numValue = typeof value === "number" ? value : parseFloat(value as string);
    const isGood = label === "Coverage" ? numValue >= 60 : isDuplicationGood(numValue);

    return (
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-2">
          {/* Indicator dot */}
          <div className={`h-2 w-2 rounded-full ${isGood ? INDICATOR_COLORS.GOOD : INDICATOR_COLORS.WARNING}`} />
          <span
            className={`text-xl font-semibold ${
              label === "Coverage" ? getCoverageColorClass(numValue) : "text-foreground"
            }`}
          >
            {displayValue}
          </span>
        </div>
        <span className="text-muted-foreground text-xs">{label}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2">
        {/* Rating badge */}
        {rating && (
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${getRatingBgClass(rating)}`}>
            <span className={`text-sm font-semibold ${getRatingTextClass(rating)}`}>{rating.toUpperCase()}</span>
          </div>
        )}

        {/* Value */}
        <span className="text-foreground text-xl font-semibold">{displayValue}</span>
      </div>

      {/* Label */}
      <span className="text-muted-foreground text-xs">{label}</span>
    </div>
  );
}
