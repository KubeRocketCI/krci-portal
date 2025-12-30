import { Card, CardContent, CardHeader } from "@/core/components/ui/card";
import { PortfolioMetrics } from "@my-project/shared";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import { getLatestMetrics, formatNumber } from "../../utils/metrics";
import { SparklineChart } from "../shared/SparklineChart";
import { SEVERITY_COLORS, VIOLATION_COLORS } from "../../constants/colors";

export interface WidgetRowProps {
  metrics: PortfolioMetrics[] | undefined;
  isLoading?: boolean;
}

interface WidgetCardProps {
  title: string;
  value: number;
  data: Array<{ value: number; timestamp?: number }>;
  color: string;
  isLoading?: boolean;
}

function WidgetCard({ title, value, data, color, isLoading }: WidgetCardProps) {
  return (
    <Card className="bg-muted/30 hover:bg-muted/40 transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="text-muted-foreground size-4 animate-spin" />
            <span className="text-muted-foreground text-sm">Loading...</span>
          </div>
        ) : (
          <>
            <h4 className="text-2xl font-bold" style={{ color }}>
              {formatNumber(value)}
            </h4>
            <p className="text-muted-foreground text-sm">{title}</p>
          </>
        )}
      </CardHeader>
      <CardContent className="px-3 pb-2">
        {!isLoading && <SparklineChart data={data} color={color} height={70} />}
      </CardContent>
    </Card>
  );
}

export function WidgetRow({ metrics, isLoading }: WidgetRowProps) {
  const latestMetrics = useMemo(() => getLatestMetrics(metrics), [metrics]);

  // Extract sparkline data for each metric with timestamps
  // Memoized to prevent unnecessary array creation on every render
  const vulnerabilitiesData = useMemo(
    () => metrics?.map((m) => ({ value: m.vulnerabilities, timestamp: m.firstOccurrence })) || [],
    [metrics]
  );
  const projectsData = useMemo(
    () => metrics?.map((m) => ({ value: m.vulnerableProjects, timestamp: m.firstOccurrence })) || [],
    [metrics]
  );
  const componentsData = useMemo(
    () => metrics?.map((m) => ({ value: m.vulnerableComponents, timestamp: m.firstOccurrence })) || [],
    [metrics]
  );
  const riskScoreData = useMemo(
    () => metrics?.map((m) => ({ value: m.inheritedRiskScore, timestamp: m.firstOccurrence })) || [],
    [metrics]
  );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <WidgetCard
        title="Portfolio Vulnerabilities"
        value={latestMetrics?.vulnerabilities ?? 0}
        data={vulnerabilitiesData}
        color={SEVERITY_COLORS.CRITICAL}
        isLoading={isLoading}
      />
      <WidgetCard
        title="Projects at Risk"
        value={latestMetrics?.vulnerableProjects ?? 0}
        data={projectsData}
        color={SEVERITY_COLORS.HIGH}
        isLoading={isLoading}
      />
      <WidgetCard
        title="Vulnerable Components"
        value={latestMetrics?.vulnerableComponents ?? 0}
        data={componentsData}
        color={SEVERITY_COLORS.MEDIUM}
        isLoading={isLoading}
      />
      <WidgetCard
        title="Inherited Risk Score"
        value={latestMetrics?.inheritedRiskScore ?? 0}
        data={riskScoreData}
        color={VIOLATION_COLORS.WARN}
        isLoading={isLoading}
      />
    </div>
  );
}
