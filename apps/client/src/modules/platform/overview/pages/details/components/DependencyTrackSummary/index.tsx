import { Badge } from "@/core/components/ui/badge";
import { SEVERITY_COLORS, SEVERITY_BG_COLORS } from "@/modules/platform/security/constants/severity";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";
import { LoadingState } from "@/modules/platform/overview/components/LoadingState";
import { DashboardCard } from "@/modules/platform/overview/components/DashboardCard";
import { useLatestPortfolioMetrics } from "@/modules/platform/overview/hooks/useLatestPortfolioMetrics";

interface SeverityRowProps {
  label: string;
  count: number;
  color: string;
  bgColor: string;
}

function SeverityRow({ label, count, color, bgColor }: SeverityRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-foreground text-sm">{label}</span>
      <span
        className="min-w-[2rem] rounded px-2 py-0.5 text-center text-xs font-medium"
        style={{
          color,
          backgroundColor: bgColor,
        }}
      >
        {count}
      </span>
    </div>
  );
}

function getHeaderIcon(latest: boolean, hasIssues: boolean) {
  if (!latest) return { icon: ShieldCheck as typeof ShieldCheck, iconColor: undefined };
  if (hasIssues) return { icon: ShieldAlert as typeof ShieldAlert, iconColor: STATUS_COLOR.ERROR };
  return { icon: ShieldCheck as typeof ShieldCheck, iconColor: STATUS_COLOR.SUCCESS };
}

export function DependencyTrackSummary() {
  const { data, isLoading, isError } = useLatestPortfolioMetrics();

  if (isError) return null;

  const latest = Array.isArray(data) ? data[data.length - 1] : undefined;
  const critical = latest?.critical ?? 0;
  const high = latest?.high ?? 0;
  const medium = latest?.medium ?? 0;
  const low = latest?.low ?? 0;
  const totalVulns = latest?.vulnerabilities ?? 0;
  const policyViolations = latest?.policyViolationsTotal ?? 0;
  const hasIssues = critical > 0 || high > 0;

  const { icon, iconColor } = getHeaderIcon(!!latest, hasIssues);

  return (
    <DashboardCard
      title="Vulnerability Summary"
      icon={icon}
      iconColor={iconColor}
      badge={
        latest && (
          <Badge variant={hasIssues ? "error" : totalVulns > 0 ? "neutral" : "success"}>{totalVulns} total</Badge>
        )
      }
    >
      {isLoading ? (
        <LoadingState />
      ) : !latest ? (
        <p className="text-muted-foreground py-6 text-center text-sm">No vulnerability data available</p>
      ) : (
        <>
          <div className="space-y-2.5">
            <SeverityRow
              label="Critical"
              count={critical}
              color={SEVERITY_COLORS.CRITICAL}
              bgColor={SEVERITY_BG_COLORS.CRITICAL}
            />
            <SeverityRow label="High" count={high} color={SEVERITY_COLORS.HIGH} bgColor={SEVERITY_BG_COLORS.HIGH} />
            <SeverityRow
              label="Medium"
              count={medium}
              color={SEVERITY_COLORS.MEDIUM}
              bgColor={SEVERITY_BG_COLORS.MEDIUM}
            />
            <SeverityRow label="Low" count={low} color={SEVERITY_COLORS.LOW} bgColor={SEVERITY_BG_COLORS.LOW} />
          </div>

          {policyViolations > 0 && (
            <div className="mt-4 flex items-center justify-between border-t pt-3">
              <span className="flex items-center gap-1.5 text-sm">
                <AlertTriangle className="size-3.5" style={{ color: STATUS_COLOR.MISSING }} />
                <span className="text-muted-foreground">Policy Violations</span>
              </span>
              <span className="text-foreground text-sm font-medium">{policyViolations}</span>
            </div>
          )}
        </>
      )}
    </DashboardCard>
  );
}
