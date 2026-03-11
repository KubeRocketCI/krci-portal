import { Badge } from "@/core/components/ui/badge";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { LoadingState } from "@/modules/platform/overview/components/LoadingState";
import { DashboardCard } from "@/modules/platform/overview/components/DashboardCard";
import { useQualityGateSummary } from "@/modules/platform/overview/hooks/useQualityGateSummary";

export function SonarQubeQualitySummary() {
  const { data, isLoading, isError } = useQualityGateSummary();

  if (isError) return null;

  const passed = data?.passed ?? 0;
  const failed = data?.failed ?? 0;
  const warned = data?.warned ?? 0;
  const total = data?.total ?? 0;
  const passRate = data?.passRate;
  const allPassed = failed === 0 && warned === 0 && total > 0;

  const passedWidth = total > 0 ? (passed / total) * 100 : 0;
  const warnedWidth = total > 0 ? (warned / total) * 100 : 0;
  const failedWidth = total > 0 ? (failed / total) * 100 : 0;

  return (
    <DashboardCard
      title="SonarQube Quality"
      icon={allPassed ? ShieldCheck : ShieldAlert}
      iconColor={allPassed ? STATUS_COLOR.SUCCESS : STATUS_COLOR.ERROR}
      badge={
        passRate !== null &&
        passRate !== undefined && (
          <Badge variant={allPassed ? "success" : failed > 0 ? "error" : "neutral"}>{passRate}% pass rate</Badge>
        )
      }
    >
      {isLoading ? (
        <LoadingState />
      ) : total === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">No SonarQube projects found</p>
      ) : (
        <>
          <div className="bg-muted mb-4 flex h-2 overflow-hidden rounded-full">
            {passedWidth > 0 && (
              <div className="h-full" style={{ width: `${passedWidth}%`, backgroundColor: STATUS_COLOR.SUCCESS }} />
            )}
            {warnedWidth > 0 && (
              <div className="h-full" style={{ width: `${warnedWidth}%`, backgroundColor: STATUS_COLOR.MISSING }} />
            )}
            {failedWidth > 0 && (
              <div className="h-full" style={{ width: `${failedWidth}%`, backgroundColor: STATUS_COLOR.ERROR }} />
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ backgroundColor: STATUS_COLOR.SUCCESS }} />
              <span className="text-muted-foreground">Passed</span>
              <span className="text-foreground font-medium">{passed}</span>
            </div>
            {warned > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ backgroundColor: STATUS_COLOR.MISSING }} />
                <span className="text-muted-foreground">Warning</span>
                <span className="text-foreground font-medium">{warned}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ backgroundColor: STATUS_COLOR.ERROR }} />
              <span className="text-muted-foreground">Failed</span>
              <span className="text-foreground font-medium">{failed}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Total</span>
              <span className="text-foreground font-medium">{total}</span>
            </div>
          </div>
        </>
      )}
    </DashboardCard>
  );
}
