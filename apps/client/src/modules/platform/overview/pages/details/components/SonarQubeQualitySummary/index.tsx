import { Card, CardContent } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { useTRPCClient } from "@/core/providers/trpc";
import { useQuery } from "@tanstack/react-query";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";

function useQualityGateSummary() {
  const trpc = useTRPCClient();

  return useQuery({
    queryKey: ["sonarqube", "qualityGateSummary"],
    queryFn: () => trpc.sonarqube.getQualityGateSummary.query(),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: false,
  });
}

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
    <Card className="border">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {allPassed ? (
              <ShieldCheck className="size-4" style={{ color: STATUS_COLOR.SUCCESS }} />
            ) : (
              <ShieldAlert className="size-4" style={{ color: STATUS_COLOR.ERROR }} />
            )}
            <h2 className="text-foreground text-base font-medium">SonarQube Quality</h2>
          </div>
          {passRate !== null && passRate !== undefined && (
            <Badge variant={allPassed ? "success" : failed > 0 ? "error" : "neutral"}>{passRate}% pass rate</Badge>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="text-muted-foreground size-5 animate-spin" />
            <span className="text-muted-foreground ml-2 text-sm">Loading...</span>
          </div>
        ) : total === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">No SonarQube projects found</p>
        ) : (
          <>
            <div className="mb-4 flex h-2 overflow-hidden rounded-full bg-gray-100">
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
      </CardContent>
    </Card>
  );
}
