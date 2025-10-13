import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import React from "react";
import { NoDataWidgetWrapper } from "@/core/components/NoDataWidgetWrapper";
import { Link } from "@tanstack/react-router";
import { routeDependencyTrackConfiguration } from "@/modules/platform/configuration/modules/dependency-track/route";
import { useClusterStore } from "@/k8s/store";
import { Button } from "@/core/components/ui/button";
import { LinkCreationService } from "@/k8s/services/link-creation";
import { useShallow } from "zustand/react/shallow";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/core/clients/trpc";

const MetricsCell = ({
  color,
  textColor,
  value,
}: {
  color?: string;
  textColor?: string;
  value: number | string | React.ReactNode;
}) => {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      textAlign="center"
      sx={{
        backgroundColor: (t) => color ?? t.palette.secondary.dark,
        px: (t) => t.typography.pxToRem(9),
        py: (t) => t.typography.pxToRem(5),
      }}
    >
      {typeof value === "string" || typeof value === "number" ? (
        <Typography fontSize={10} fontWeight={500} color={(t) => textColor ?? t.palette.common.white}>
          {value}
        </Typography>
      ) : (
        value
      )}
    </Box>
  );
};

interface DependencyTrackMetricsProps {
  componentName: string;
}

export const DependencyTrackMetrics = ({ componentName }: DependencyTrackMetricsProps) => {
  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

  const depTrackDataQuery = useQuery({
    queryKey: ["depTrackData", clusterName, defaultNamespace, name],
    queryFn: async () => {
      const res = await trpc.krakend.getDepTrackProject.query({
        clusterName,
        namespace: defaultNamespace,
        name: componentName,
      });
      return res;
    },
  });

  return (
    <NoDataWidgetWrapper
      hasData={
        !!depTrackDataQuery.data?.metrics && !!depTrackDataQuery.data?.baseUrl && !!depTrackDataQuery.data?.projectID
      }
      isLoading={depTrackDataQuery.isLoading}
      text={
        <Typography variant={"body1"} color="secondary.dark" component={"div"}>
          No metrics available.{" "}
          <Button variant="link" asChild>
            <Link
              to={routeDependencyTrackConfiguration.to}
              params={{
                clusterName,
              }}
            >
              Set up DependencyTrack configuration
            </Link>
          </Button>{" "}
          and enable reporting in your pipeline.
        </Typography>
      }
    >
      {depTrackDataQuery.isLoading ? (
        <CircularProgress />
      ) : (
        <>
          <Link
            to={LinkCreationService.depTrack.createDashboardLink(
              depTrackDataQuery.data!.baseUrl!,
              depTrackDataQuery.data!.projectID!
            )}
            target={"_blank"}
            color="inherit"
          >
            <Stack direction="row" sx={{ borderRadius: "2px", overflow: "hidden" }}>
              <MetricsCell value="dependencies" />
              {!!depTrackDataQuery.data?.metrics && !depTrackDataQuery.isLoading ? (
                <>
                  <MetricsCell value={depTrackDataQuery.data?.metrics?.critical} color="#FD4C4D" />
                  <MetricsCell value={depTrackDataQuery.data?.metrics?.high} color="#FF8832" />
                  <MetricsCell value={depTrackDataQuery.data?.metrics?.medium} color="#FFC754" />
                  <MetricsCell value={depTrackDataQuery.data?.metrics?.low} color="#18BE94" />
                  <MetricsCell
                    value={depTrackDataQuery.data?.metrics?.unassigned}
                    color="#E6E6F0"
                    textColor="#596D80"
                  />
                </>
              ) : (
                <MetricsCell
                  value={
                    <Box
                      minWidth={(t) => t.typography.pxToRem(120)}
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                    >
                      <CircularProgress
                        sx={{
                          width: (t) => `${t.typography.pxToRem(14)} !important`,
                          height: (t) => `${t.typography.pxToRem(14)} !important`,
                        }}
                      />
                    </Box>
                  }
                  color="#E6E6F0"
                  textColor="#596D80"
                />
              )}
            </Stack>
          </Link>
        </>
      )}
    </NoDataWidgetWrapper>
  );
};
