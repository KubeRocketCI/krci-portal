import { Card, CardContent, CardFooter, CardHeader } from "@/core/components/ui/card";
import { PortfolioMetrics } from "@my-project/shared";
import { getLatestMetrics, calculatePercent, formatLastMeasurement } from "../../utils/metrics";
import { MetricProgressBar } from "../shared/MetricProgressBar";
import { PolicyViolationsStateChart as SharedPolicyViolationsStateChart } from "../shared/PolicyViolationsStateChart";
import { VIOLATION_COLORS } from "../../constants/colors";

export interface PolicyViolationsStateWidgetProps {
  metrics: PortfolioMetrics[] | undefined;
  isLoading?: boolean;
}

/**
 * Dashboard widget for policy violations by state
 * Composes the shared PolicyViolationsStateChart with Card wrapper and footer metrics
 */
export function PolicyViolationsState({ metrics, isLoading }: PolicyViolationsStateWidgetProps) {
  const latestMetrics = getLatestMetrics(metrics);

  // Calculate percentages
  const total = latestMetrics?.policyViolationsTotal ?? 0;
  const fail = latestMetrics?.policyViolationsFail ?? 0;
  const warn = latestMetrics?.policyViolationsWarn ?? 0;
  const info = latestMetrics?.policyViolationsInfo ?? 0;

  const failPercent = calculatePercent(total, fail);
  const warnPercent = calculatePercent(total, warn);
  const infoPercent = calculatePercent(total, info);

  const lastMeasurement = latestMetrics ? formatLastMeasurement(latestMetrics.lastOccurrence) : "N/A";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold">Policy Violations by State</h4>
            <p className="text-muted-foreground text-sm">Last measurement: {lastMeasurement}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <SharedPolicyViolationsStateChart metrics={metrics} isLoading={isLoading} />
      </CardContent>
      <CardFooter>
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
          <MetricProgressBar label="Fail" value={fail} percent={failPercent} color={VIOLATION_COLORS.FAIL} />
          <MetricProgressBar label="Warn" value={warn} percent={warnPercent} color={VIOLATION_COLORS.WARN} />
          <MetricProgressBar label="Info" value={info} percent={infoPercent} color={VIOLATION_COLORS.INFO} />
        </div>
      </CardFooter>
    </Card>
  );
}
