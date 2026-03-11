import { Card, CardContent } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { useTRPCClient } from "@/core/providers/trpc";
import { useQuery } from "@tanstack/react-query";
import { SEVERITY_COLORS, SEVERITY_BG_COLORS } from "@/modules/platform/security/constants/severity";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { ShieldCheck, ShieldAlert, Loader2, AlertTriangle } from "lucide-react";

function useLatestPortfolioMetrics() {
  const trpc = useTRPCClient();

  return useQuery({
    queryKey: ["dependencyTrack", "portfolioMetrics", 1],
    queryFn: () => trpc.dependencyTrack.getPortfolioMetrics.query({ days: 1 }),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: false,
  });
}

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

  return (
    <Card className="border">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!latest ? (
              <ShieldCheck className="text-muted-foreground size-4" />
            ) : hasIssues ? (
              <ShieldAlert className="size-4" style={{ color: STATUS_COLOR.ERROR }} />
            ) : (
              <ShieldCheck className="size-4" style={{ color: STATUS_COLOR.SUCCESS }} />
            )}
            <h2 className="text-foreground text-base font-medium">Vulnerability Summary</h2>
          </div>
          {latest && (
            <Badge variant={hasIssues ? "error" : totalVulns > 0 ? "neutral" : "success"}>{totalVulns} total</Badge>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="text-muted-foreground size-5 animate-spin" />
            <span className="text-muted-foreground ml-2 text-sm">Loading...</span>
          </div>
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
      </CardContent>
    </Card>
  );
}
