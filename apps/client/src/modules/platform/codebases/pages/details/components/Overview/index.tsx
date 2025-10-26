import { Chip, Grid, Stack, Typography } from "@mui/material";
import { useInfoRows } from "./hooks/useInfoRows";
import { InfoColumns } from "@/core/components/InfoColumns";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { BorderedSection } from "@/core/components/BorderedSection";
import { useCodebaseWatch } from "../../hooks/data";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { EDP_OPERATOR_GUIDE } from "@/k8s/constants/docs-urls";
import { DependencyTrackMetrics } from "../DeeptrackVulnerabilities";
import { routeComponentDetails } from "../../route";
import { trpc } from "@/core/clients/trpc";
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
    <Stack spacing={3}>
      <BorderedSection title="Component Details">
        <div>
          <LoadingWrapper isLoading={codebaseWatch.isLoading}>
            <InfoColumns infoRows={infoRows!} />
          </LoadingWrapper>
        </div>
      </BorderedSection>
      <BorderedSection
        title={
          <Stack spacing={2} alignItems="center" direction="row">
            <Typography fontSize={20} fontWeight={600} color="primary.dark">
              Code Quality
            </Typography>
            <Chip
              sx={{
                backgroundColor:
                  sonarDataQuery.data?.metrics?.alert_status === "OK"
                    ? STATUS_COLOR.SUCCESS
                    : sonarDataQuery.data?.metrics?.alert_status === "ERROR"
                      ? STATUS_COLOR.ERROR
                      : STATUS_COLOR.UNKNOWN,
                color: "#fff",
              }}
              size="small"
              label={
                sonarDataQuery.data?.metrics?.alert_status
                  ? getStatusLabel(sonarDataQuery.data?.metrics?.alert_status)
                  : "N/A"
              }
            />
            <LearnMoreLink url={EDP_OPERATOR_GUIDE.SONAR.url} />
          </Stack>
        }
      >
        <div>
          <Grid container alignItems={"center"}>
            <Grid item>
              <SonarMetrics componentName={params.name} />
            </Grid>
            <Grid item style={{ marginLeft: "auto" }}>
              <DependencyTrackMetrics componentName={params.name} />
            </Grid>
          </Grid>
        </div>
      </BorderedSection>
    </Stack>
  );
};
