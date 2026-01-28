import { cn } from "@/core/utils/classname";

interface SummaryStatProps {
  /** The label displayed below the value */
  label: string;
  /** The numeric value to display */
  value: number;
  /** Tailwind CSS color class for the value and optional icon */
  colorClass: string;
  /** Optional icon component to display alongside the value */
  icon?: React.ElementType;
}

/**
 * A reusable component for displaying summary statistics with an optional icon.
 * Used in report headers to show severity counts or pass/fail statistics.
 *
 * @example
 * // Without icon (severity counts)
 * <SummaryStat label="Critical" value={5} colorClass="text-red-600 dark:text-red-400" />
 *
 * @example
 * // With icon (pass/fail counts)
 * <SummaryStat
 *   icon={CheckCircle}
 *   label="Passed"
 *   value={10}
 *   colorClass="text-green-600 dark:text-green-400"
 * />
 */
export function SummaryStat({ label, value, colorClass, icon: Icon }: SummaryStatProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-1">
        {Icon && <Icon className={cn("h-5 w-5", colorClass)} />}
        <span className={cn("text-2xl font-bold", colorClass)}>{value}</span>
      </div>
      <span className="text-muted-foreground text-xs">{label}</span>
    </div>
  );
}
