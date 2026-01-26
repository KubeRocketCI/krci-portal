import { Card, CardContent, CardHeader } from "@/core/components/ui/card";
import { Skeleton } from "@/core/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { TrivyOverviewData } from "../../types";
import { SEVERITY_COLORS } from "@/modules/platform/security/constants/severity";

export interface SeverityPieChartProps {
  data: TrivyOverviewData | null;
  isLoading?: boolean;
}

interface ChartDataPoint {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: ChartDataPoint;
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0];
  return (
    <div className="bg-background rounded-lg border p-3 shadow-md">
      <div className="flex items-center gap-2">
        <span className="size-2.5 rounded-full" style={{ backgroundColor: data.payload.color }} />
        <span className="font-medium">{data.name}</span>
      </div>
      <p className="mt-1 text-sm">
        <span className="font-semibold">{data.value.toLocaleString()}</span>
        <span className="text-muted-foreground"> vulnerabilities</span>
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center py-8">
      <Skeleton className="size-48 rounded-full" />
    </div>
  );
}

/**
 * Pie chart showing severity distribution
 * Uses Recharts for visualization
 */
export function SeverityPieChart({ data, isLoading }: SeverityPieChartProps) {
  const chartData: ChartDataPoint[] = [
    { name: "Critical", value: data?.critical ?? 0, color: SEVERITY_COLORS.CRITICAL },
    { name: "High", value: data?.high ?? 0, color: SEVERITY_COLORS.HIGH },
    { name: "Medium", value: data?.medium ?? 0, color: SEVERITY_COLORS.MEDIUM },
    { name: "Low", value: data?.low ?? 0, color: SEVERITY_COLORS.LOW },
    { name: "Unknown", value: data?.unknown ?? 0, color: SEVERITY_COLORS.UNKNOWN },
  ].filter((d) => d.value > 0);

  const total = data?.totalVulnerabilities ?? 0;
  const hasData = chartData.length > 0 && total > 0;

  return (
    <Card>
      <CardHeader>
        <h4 className="text-lg font-semibold">Severity Distribution</h4>
        <p className="text-muted-foreground text-sm">Visual breakdown of vulnerability severities</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingSkeleton />
        ) : !hasData ? (
          <div className="text-muted-foreground flex h-[280px] items-center justify-center">
            No vulnerability data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span className="text-sm">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
