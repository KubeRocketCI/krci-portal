import { useMemo } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Finding } from "@my-project/shared";
import { EPSS_COLORS } from "../../../sca/constants/colors";

interface EpssVsCvssChartProps {
  findings: Finding[];
  height?: number;
}

interface ChartDataPoint {
  x: number; // CVSS score
  y: number; // EPSS score
  vulnId: string;
  component: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartDataPoint }>;
}

/**
 * Custom tooltip for the scatter chart
 */
function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="bg-background rounded-lg border p-3 shadow-lg">
      <div className="space-y-1 text-sm">
        <div>
          <span className="text-muted-foreground">Component: </span>
          <span className="font-medium">{data.component}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Vulnerability: </span>
          <span className="font-mono text-xs">{data.vulnId}</span>
        </div>
        <div>
          <span className="text-muted-foreground">CVSS: </span>
          <span className="font-semibold">{data.x.toFixed(1)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">EPSS: </span>
          <span className="font-semibold">{data.y.toFixed(6)}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Scatter chart showing the relationship between CVSS and EPSS scores
 * X-axis: CVSS score (0-10)
 * Y-axis: EPSS score (0-1)
 */
export function EpssVsCvssChart({ findings, height = 400 }: EpssVsCvssChartProps) {
  const chartData = useMemo(() => {
    return findings
      .map((finding) => {
        const cvssScore = finding.vulnerability.cvssV3BaseScore ?? finding.vulnerability.cvssV2BaseScore;
        const epssScore = finding.vulnerability.epssScore;

        return cvssScore !== undefined && epssScore !== undefined
          ? {
              x: cvssScore,
              y: epssScore,
              vulnId: finding.vulnerability.vulnId,
              component: finding.component.version
                ? `${finding.component.name}:${finding.component.version}`
                : finding.component.name,
            }
          : null;
      })
      .filter((item): item is ChartDataPoint => item !== null);
  }, [findings]);

  if (chartData.length === 0) {
    return (
      <div className="bg-muted/30 flex items-center justify-center rounded-lg border" style={{ height }}>
        <p className="text-muted-foreground">No EPSS data available for this project</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          type="number"
          dataKey="x"
          name="CVSS"
          domain={[0, 10]}
          label={{
            value: "CVSS Score",
            position: "insideBottom",
            offset: -10,
            className: "fill-muted-foreground text-sm",
          }}
          tick={{ className: "fill-primary text-xs" }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name="EPSS"
          domain={[0, 1]}
          label={{
            value: "EPSS Score",
            angle: -90,
            position: "insideLeft",
            className: "fill-muted-foreground text-sm",
          }}
          tick={{ className: "fill-primary text-xs" }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Scatter name="Vulnerabilities" data={chartData} fill={EPSS_COLORS.SCATTER_POINT} fillOpacity={0.7} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
