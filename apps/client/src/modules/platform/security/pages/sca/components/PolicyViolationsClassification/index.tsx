import { Card, CardContent, CardFooter, CardHeader } from "@/core/components/ui/card";
import { PortfolioMetrics } from "@my-project/shared";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Loader2 } from "lucide-react";
import { getLatestMetrics, transformToChartData, calculatePercent, formatLastMeasurement } from "../../utils/metrics";
import { MetricProgressBar } from "../shared/MetricProgressBar";
import { LabeledValueChartTooltip } from "../shared/ChartTooltip";
import { VIOLATION_COLORS, CHART_COLORS } from "../../constants/colors";

export interface PolicyViolationsClassificationProps {
  metrics: PortfolioMetrics[] | undefined;
  isLoading?: boolean;
}

export function PolicyViolationsClassification({ metrics, isLoading }: PolicyViolationsClassificationProps) {
  const latestMetrics = getLatestMetrics(metrics);
  const chartData = metrics ? transformToChartData(metrics) : [];

  // Calculate percentages
  const total = latestMetrics?.policyViolationsTotal ?? 0;
  const security = latestMetrics?.policyViolationsSecurityTotal ?? 0;
  const license = latestMetrics?.policyViolationsLicenseTotal ?? 0;
  const operational = latestMetrics?.policyViolationsOperationalTotal ?? 0;

  const securityPercent = calculatePercent(total, security);
  const licensePercent = calculatePercent(total, license);
  const operationalPercent = calculatePercent(total, operational);

  const lastMeasurement = latestMetrics ? formatLastMeasurement(latestMetrics.lastOccurrence) : "N/A";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold">Policy Violations by Classification</h4>
            <p className="text-muted-foreground text-sm">Last measurement: {lastMeasurement}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[200px] items-center justify-center">
            <Loader2 className="text-muted-foreground size-8 animate-spin" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="text-muted-foreground flex h-[200px] items-center justify-center">No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} stroke={CHART_COLORS.AXIS_STROKE} />
              <YAxis tick={{ fontSize: 12 }} stroke={CHART_COLORS.AXIS_STROKE} />
              <Tooltip
                content={
                  <LabeledValueChartTooltip
                    labels={[
                      { key: "policyViolationsSecurityTotal", label: "Security", color: VIOLATION_COLORS.SECURITY },
                      { key: "policyViolationsLicenseTotal", label: "License", color: VIOLATION_COLORS.LICENSE },
                      {
                        key: "policyViolationsOperationalTotal",
                        label: "Operational",
                        color: VIOLATION_COLORS.OPERATIONAL,
                      },
                    ]}
                  />
                }
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} iconType="line" />
              <Line
                type="monotone"
                dataKey="policyViolationsSecurityTotal"
                name="Security"
                stroke={VIOLATION_COLORS.SECURITY}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="policyViolationsLicenseTotal"
                name="License"
                stroke={VIOLATION_COLORS.LICENSE}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="policyViolationsOperationalTotal"
                name="Operational"
                stroke={VIOLATION_COLORS.OPERATIONAL}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
      <CardFooter>
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
          <MetricProgressBar
            label="Security"
            value={security}
            percent={securityPercent}
            color={VIOLATION_COLORS.SECURITY}
          />
          <MetricProgressBar
            label="License"
            value={license}
            percent={licensePercent}
            color={VIOLATION_COLORS.LICENSE}
          />
          <MetricProgressBar
            label="Operational"
            value={operational}
            percent={operationalPercent}
            color={VIOLATION_COLORS.OPERATIONAL}
          />
        </div>
      </CardFooter>
    </Card>
  );
}
