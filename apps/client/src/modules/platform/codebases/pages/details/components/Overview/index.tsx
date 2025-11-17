import { Badge } from "@/core/components/ui/badge";
import { useInfoRows } from "./hooks/useInfoRows";
import { InfoColumns } from "@/core/components/InfoColumns";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { BorderedSection } from "@/core/components/BorderedSection";
import { useCodebaseWatch } from "../../hooks/data";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { EDP_OPERATOR_GUIDE } from "@/k8s/constants/docs-urls";
import { DependencyTrackMetrics } from "../DeeptrackVulnerabilities";
import { routeComponentDetails } from "../../route";
import { useTRPCClient } from "@/core/providers/trpc";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { useQuery } from "@tanstack/react-query";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { SonarMetrics } from "../SonarQubeMetrics";

const statusMap: Record<string, string> = {
  OK: "Passed",
  ERROR: "Failed",
};
const getStatusLabel = (status: string) => statusMap?.[status] || "Unknown";

export const Overview = () => {
  const trpc = useTRPCClient();
  const codebaseWatch = useCodebaseWatch();
  const infoRows = useInfoRows();

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
      <BorderedSection title="Component Details">
        <div>
          <LoadingWrapper isLoading={codebaseWatch.isLoading}>
            <InfoColumns infoRows={infoRows!} />
          </LoadingWrapper>
        </div>
      </BorderedSection>
      <BorderedSection
        title={
          <div className="flex items-center gap-2">
            <h3 className="text-foreground text-xl font-semibold">Code Quality</h3>
            <Badge
              variant="default"
              className="text-white"
              style={{
                backgroundColor:
                  sonarDataQuery.data?.metrics?.alert_status === "OK"
                    ? STATUS_COLOR.SUCCESS
                    : sonarDataQuery.data?.metrics?.alert_status === "ERROR"
                      ? STATUS_COLOR.ERROR
                      : STATUS_COLOR.UNKNOWN,
              }}
            >
              {sonarDataQuery.data?.metrics?.alert_status
                ? getStatusLabel(sonarDataQuery.data?.metrics?.alert_status)
                : "N/A"}
            </Badge>
            <LearnMoreLink url={EDP_OPERATOR_GUIDE.SONAR.url} />
          </div>
        }
      >
        <div>
          <div className="flex items-center">
            <div>
              <SonarMetrics componentName={params.name} />
            </div>
            <div className="ml-auto">
              <DependencyTrackMetrics componentName={params.name} />
            </div>
          </div>
        </div>
      </BorderedSection>
    </div>
  );
};
