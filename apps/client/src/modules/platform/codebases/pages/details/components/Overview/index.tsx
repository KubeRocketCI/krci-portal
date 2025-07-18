import { Chip, Grid, Stack, Typography } from "@mui/material";
import React from "react";
import { useParams } from "react-router-dom";
import { BorderedSection } from "../../../../components/BorderedSection";
import { InfoColumns } from "../../../../components/InfoColumns";
import { LearnMoreLink } from "../../../../components/LearnMoreLink";
import { LoadingWrapper } from "../../../../components/LoadingWrapper";
import { STATUS_COLOR } from "../../../../constants/colors";
import { EDP_OPERATOR_GUIDE } from "../../../../constants/urls";
import { DependencyTrackMetrics } from "../../../../widgets/DeeptrackVulnerabilities";
import { SonarQubeMetrics } from "../../../../widgets/SonarQubeMetrics";
import { useDataContext } from "../../providers/Data/hooks";
import { ComponentDetailsRouteParams } from "../../types";
import { useInfoRows } from "./hooks/useInfoRows";

const statusMap: Record<string, string> = {
  OK: "Passed",
  ERROR: "Failed",
};
const getStatusLabel = (status: string) => statusMap?.[status] || "Unknown";

export const Overview = () => {
  const { name } = useParams<ComponentDetailsRouteParams>();

  const { sonarData, depTrackData } = useDataContext();
  const infoRows = useInfoRows();

  return (
    <Stack spacing={3}>
      <BorderedSection title="Component Details">
        <div>
          <LoadingWrapper isLoading={infoRows === null}>
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
      </BorderedSection>
    </Stack>
  );
};
