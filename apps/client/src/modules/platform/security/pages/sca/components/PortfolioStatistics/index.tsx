import { PortfolioMetrics } from "@my-project/shared";
import { Loader2 } from "lucide-react";
import { getLatestMetrics, formatNumber } from "../../utils/metrics";
import { VARIANT_COLORS } from "../../constants/colors";

export interface PortfolioStatisticsProps {
  metrics: PortfolioMetrics[] | undefined;
  isLoading?: boolean;
}

interface StatCardProps {
  title: string;
  value: number;
  variant: "info" | "danger" | "warning";
  isLoading?: boolean;
}

const VARIANT_COLOR_MAP = {
  info: VARIANT_COLORS.INFO,
  danger: VARIANT_COLORS.DANGER,
  warning: VARIANT_COLORS.WARNING,
} as const;

function StatCard({ title, value, variant, isLoading }: StatCardProps) {
  const borderColor = VARIANT_COLOR_MAP[variant];

  return (
    <div className="border-border bg-card relative rounded border p-3">
      <div className="absolute top-0 left-0 h-full w-1 rounded-l" style={{ backgroundColor: borderColor }} />
      <div className="pl-2">
        <p className="text-muted-foreground mb-1 text-sm">{title}</p>
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="text-muted-foreground size-4 animate-spin" />
          </div>
        ) : (
          <strong className="text-xl font-semibold">{formatNumber(value)}</strong>
        )}
      </div>
    </div>
  );
}

export function PortfolioStatistics({ metrics, isLoading }: PortfolioStatisticsProps) {
  const latestMetrics = getLatestMetrics(metrics);

  return (
    <div>
      <h3 className="mb-4 text-xl font-semibold">Portfolio Statistics</h3>
      <div className="space-y-4">
        {/* First Row */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="grid grid-cols-2 gap-4">
            <StatCard title="Projects" value={latestMetrics?.projects ?? 0} variant="info" isLoading={isLoading} />
            <StatCard
              title="Vulnerable Projects"
              value={latestMetrics?.vulnerableProjects ?? 0}
              variant="danger"
              isLoading={isLoading}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <StatCard title="Components" value={latestMetrics?.components ?? 0} variant="info" isLoading={isLoading} />
            <StatCard
              title="Vulnerable Components"
              value={latestMetrics?.vulnerableComponents ?? 0}
              variant="danger"
              isLoading={isLoading}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              title="Portfolio Vulnerabilities"
              value={latestMetrics?.vulnerabilities ?? 0}
              variant="danger"
              isLoading={isLoading}
            />
            <StatCard
              title="Suppressed"
              value={latestMetrics?.suppressed ?? 0}
              variant="warning"
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2">
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              title="Policy Violations"
              value={latestMetrics?.policyViolationsTotal ?? 0}
              variant="info"
              isLoading={isLoading}
            />
            <StatCard
              title="License Violations"
              value={latestMetrics?.policyViolationsLicenseTotal ?? 0}
              variant="info"
              isLoading={isLoading}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              title="Operational Violations"
              value={latestMetrics?.policyViolationsOperationalTotal ?? 0}
              variant="info"
              isLoading={isLoading}
            />
            <StatCard
              title="Security Violations"
              value={latestMetrics?.policyViolationsSecurityTotal ?? 0}
              variant="info"
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
