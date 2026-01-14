import { Card, CardHeader, CardTitle, CardContent } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Skeleton } from "@/core/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ProjectWithMetrics } from "@my-project/shared";
import { MetricCardConfig } from "./constants";
import { formatNumber, formatPercentage, formatRating, formatDebtTime } from "../../utils/formatters";
import { getRatingColorClass } from "../../../sast/utils/ratings";
import { getCoverageColorClass, isDuplicationGood } from "../../../sast/utils/metrics";
import { QUALITY_GATE_COLORS, INDICATOR_COLORS } from "../../../sast/constants/colors";
import { cn } from "@/core/utils/classname";

interface MetricCardProps {
  config: MetricCardConfig;
  project: ProjectWithMetrics | null | undefined;
  isLoading?: boolean;
}

function formatValue(value: string | undefined, type: string | undefined): string {
  if (!value) return "—";

  if (type === "percentage") {
    return formatPercentage(value);
  }

  if (type === "status") {
    const statusMap: Record<string, string> = {
      OK: "Passed",
      WARN: "Warning",
      ERROR: "Failed",
      NONE: "—",
    };
    return statusMap[value] || value;
  }

  return formatNumber(value);
}

function getPercentageColorClass(value: string | undefined, metricKey: string): string {
  if (!value) return "";

  const numValue = parseFloat(value);
  if (isNaN(numValue)) return "";

  if (metricKey === "coverage" || metricKey === "new_coverage") {
    return getCoverageColorClass(numValue);
  }

  if (metricKey === "duplicated_lines_density" || metricKey === "new_duplicated_lines_density") {
    if (!isDuplicationGood(numValue) && numValue > 10) {
      return "text-red-600 dark:text-red-400";
    }
  }

  return "";
}

function getTrendIcon(trendValue: string, metricKey: string) {
  const value = parseFloat(trendValue);
  if (isNaN(value) || value === 0) {
    return <Minus className="text-muted-foreground h-3 w-3" />;
  }

  const higherIsBetter = metricKey === "coverage" || metricKey === "new_coverage";
  const isPositive = value > 0;
  const isGood = higherIsBetter ? isPositive : !isPositive;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const colorClass = isGood ? "text-green-600" : "text-red-600";

  return <TrendIcon className={`h-3 w-3 ${colorClass}`} />;
}

function getQualityGateColorClass(status: string): string {
  const statusKey = status as keyof typeof QUALITY_GATE_COLORS;
  return QUALITY_GATE_COLORS[statusKey]?.combined || QUALITY_GATE_COLORS.NONE.combined;
}

function getIndicatorDot(metricKey: string, value: string | undefined) {
  if (!value) return null;

  const numValue = parseFloat(value);
  if (isNaN(numValue)) return null;

  let isGood = false;
  if (metricKey === "coverage" || metricKey === "new_coverage") {
    isGood = numValue >= 60;
  } else if (metricKey === "duplicated_lines_density" || metricKey === "new_duplicated_lines_density") {
    isGood = isDuplicationGood(numValue);
  }

  return <div className={`h-2 w-2 rounded-full ${isGood ? INDICATOR_COLORS.GOOD : INDICATOR_COLORS.WARNING}`} />;
}

export function MetricCard({ config, project, isLoading }: MetricCardProps) {
  const measures = project?.measures || {};
  const value = measures[config.metricKey];
  const ratingValue = config.ratingKey ? measures[config.ratingKey] : undefined;
  const trendValue = config.trendKey ? measures[config.trendKey] : undefined;
  const debtValue = config.debtKey ? measures[config.debtKey] : undefined;

  const rating = formatRating(ratingValue);
  const formattedValue = formatValue(value, config.type);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <config.icon className="text-muted-foreground h-5 w-5" />
              <CardTitle className="text-base">{config.title}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-4 w-24" />
        </CardContent>
      </Card>
    );
  }

  const valueColorClass = config.type === "percentage" ? getPercentageColorClass(value, config.metricKey) : "";
  const indicatorDot = config.type === "percentage" ? getIndicatorDot(config.metricKey, value) : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <config.icon className="text-muted-foreground h-5 w-5" />
            <CardTitle className="text-base">{config.title}</CardTitle>
          </div>
          {rating && rating !== "—" && (
            <Badge variant="outline" className={cn(getRatingColorClass(rating))}>
              {rating}
            </Badge>
          )}
          {config.type === "status" && value && (
            <Badge variant="outline" className={cn(getQualityGateColorClass(value))}>
              {value}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {indicatorDot}
            <div className={cn("text-3xl font-bold", valueColorClass)}>{formattedValue}</div>
          </div>

          {trendValue && config.trendKey && (
            <div className="text-muted-foreground flex items-center gap-1 text-sm">
              {getTrendIcon(trendValue, config.trendKey)}
              <span>{formatValue(trendValue, config.type)} new</span>
            </div>
          )}

          {debtValue && <div className="text-muted-foreground text-sm">Debt: {formatDebtTime(debtValue)}</div>}

          <p className="text-muted-foreground text-xs">{config.description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
