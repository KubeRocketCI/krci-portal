import { CircularProgress } from "@mui/material";
import React from "react";
import { NoDataWidgetWrapper } from "@/core/components/NoDataWidgetWrapper";
import { Link } from "@tanstack/react-router";
import { PATH_CONFIG_DEPENDENCY_TRACK_FULL } from "@/modules/platform/configuration/modules/dependency-track/route";
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
    <div
      className="flex items-center justify-center text-center px-[9px] py-[5px]"
      style={{ backgroundColor: color ?? '#424242', color: textColor ?? '#ffffff' }}
    >
      {typeof value === "string" || typeof value === "number" ? (
        <span className="text-[10px] font-medium" style={{ color: textColor ?? '#ffffff' }}>
          {value}
        </span>
      ) : (
        value
      )}
    </div>
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
        <p className="text-base text-muted-foreground">
          No metrics available.{" "}
          <Button variant="link" asChild className="p-0!">
            <Link
              to={PATH_CONFIG_DEPENDENCY_TRACK_FULL}
              params={{
                clusterName,
              }}
            >
              Set up DependencyTrack configuration
            </Link>
          </Button>{" "}
          and enable reporting in your pipeline.
        </p>
      }
    >
      {depTrackDataQuery.isLoading ? (
        <CircularProgress />
      ) : depTrackDataQuery.data?.baseUrl ? (
        <>
          <Link
            to={LinkCreationService.depTrack.createDashboardLink(
              depTrackDataQuery.data!.baseUrl!,
              depTrackDataQuery.data!.projectID!
            )}
            target={"_blank"}
            color="inherit"
          >
            <div className="flex rounded-[2px] overflow-hidden">
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
                    <div
                      className="min-w-[120px] flex justify-center items-center"
                    >
                      <CircularProgress
                        sx={{
                          width: (t) => `${t.typography.pxToRem(14)} !important`,
                          height: (t) => `${t.typography.pxToRem(14)} !important`,
                        }}
                      />
                    </div>
                  }
                  color="#E6E6F0"
                  textColor="#596D80"
                />
              )}
            </div>
          </Link>
        </>
      ) : null}
    </NoDataWidgetWrapper>
  );
};
