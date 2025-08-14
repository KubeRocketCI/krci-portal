import { Stack } from "@mui/material";
import { useInfoRows } from "./hooks/useInfoRows";
import { InfoColumns } from "@/core/components/InfoColumns";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { BorderedSection } from "@/core/components/BorderedSection";
import { useCodebaseWatch } from "../../hooks/data";

// const statusMap: Record<string, string> = {
//   OK: "Passed",
//   ERROR: "Failed",
// };
// const getStatusLabel = (status: string) => statusMap?.[status] || "Unknown";

export const Overview = () => {
  const codebaseWatch = useCodebaseWatch();
  const infoRows = useInfoRows();

  return (
    <Stack spacing={3}>
      <BorderedSection title="Component Details">
        <div>
          <LoadingWrapper isLoading={codebaseWatch.isInitialLoading}>
            <InfoColumns infoRows={infoRows!} />
          </LoadingWrapper>
        </div>
      </BorderedSection>
      {/* <BorderedSection
        title={
          <Stack spacing={2} alignItems="center" direction="row">
            <Typography fontSize={20} fontWeight={600} color="primary.dark">
              Code Quality
            </Typography>
            <Chip
              sx={{
                backgroundColor:
                  sonarData.data.metrics?.alert_status === "OK"
                    ? STATUS_COLOR.SUCCESS
                    : sonarData.data.metrics?.alert_status === "ERROR"
                      ? STATUS_COLOR.ERROR
                      : STATUS_COLOR.UNKNOWN,
                color: "#fff",
              }}
              size="small"
              label={
                sonarData.data.metrics?.alert_status ? getStatusLabel(sonarData.data.metrics?.alert_status) : "N/A"
              }
            />
            <LearnMoreLink url={EDP_OPERATOR_GUIDE.SONAR.url} />
          </Stack>
        }
      >
        <div>
          <Grid container alignItems={"center"}>
            <Grid item>
              <SonarQubeMetrics codebaseName={name} sonarData={sonarData} />
            </Grid>
            <Grid item style={{ marginLeft: "auto" }}>
              <DependencyTrackMetrics depTrackData={depTrackData} />
            </Grid>
          </Grid>
        </div>
      </BorderedSection> */}
    </Stack>
  );
};
