import { InfoColumns } from "@/core/components/InfoColumns";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { Badge } from "@/core/components/ui/badge";
import { Card } from "@/core/components/ui/card";
import { useTRPCClient } from "@/core/providers/trpc";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { EDP_OPERATOR_GUIDE } from "@/k8s/constants/docs-urls";
import { useClusterStore } from "@/k8s/store";
import { useQuery } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import { useCodebaseWatch } from "../../hooks/data";
import { routeComponentDetails } from "../../route";
import { DependencyTrackMetrics } from "../DeeptrackVulnerabilities";
import { SonarMetrics } from "../SonarQubeMetrics";
import { useInfoRows } from "./hooks/useInfoRows";

const statusMap: Record<string, string> = {
  OK: "Passed",
  ERROR: "Failed",
};
const getStatusLabel = (status: string) => statusMap?.[status] || "Unknown";

export const Overview = () => {
  const trpc = useTRPCClient();
  const codebaseWatch = useCodebaseWatch();
  const gridItems = useInfoRows();

  const params = routeComponentDetails.useParams();

  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

  const sonarDataQuery = useQuery({
    queryKey: ["sonarData", params.name],
    queryFn: async () => {
      const res = await trpc.krakend.getSonarQubeProject.query({
        clusterName,
        namespace: defaultNamespace,
        name: params.name,
      });
      return res;
    },
  });

  return (
    <div className="flex flex-col gap-3">
      <Card className="p-6">
        <h3 className="text-foreground mb-4 text-xl font-semibold">Component Details</h3>
        <LoadingWrapper isLoading={codebaseWatch.isLoading}>
          <InfoColumns gridItems={gridItems} gridCols={4} />
        </LoadingWrapper>
      </Card>
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <h3 className="text-foreground space-x-1 text-xl font-semibold">Code Quality</h3>
          <Badge
            variant="outline"
            style={
              {
                "--border-color":
                  sonarDataQuery.data?.metrics?.alert_status === "OK"
                    ? STATUS_COLOR.SUCCESS
                    : sonarDataQuery.data?.metrics?.alert_status === "ERROR"
                      ? STATUS_COLOR.ERROR
                      : STATUS_COLOR.UNKNOWN,
              } as React.CSSProperties
            }
            className="border-(--border-color)"
          >
            {sonarDataQuery.data?.metrics?.alert_status
              ? getStatusLabel(sonarDataQuery.data?.metrics?.alert_status)
              : "N/A"}
          </Badge>
          <LearnMoreLink url={EDP_OPERATOR_GUIDE.SONAR.url} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <div>
            <SonarMetrics componentName={params.name} />
          </div>
          <div>
            <DependencyTrackMetrics componentName={params.name} />
          </div>
        </div>
      </Card>
    </div>
  );
};
