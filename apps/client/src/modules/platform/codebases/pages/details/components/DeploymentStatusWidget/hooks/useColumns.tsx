import React from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/core/components/ui/button";
import { TableColumn } from "@/core/components/Table/types";
import { ENTITY_ICON } from "@/k8s/constants/entity-icons";
import { useClusterStore } from "@/k8s/store";
import { PATH_CDPIPELINE_DETAILS_FULL } from "@/modules/platform/cdpipelines/pages/details/route";
import { useShallow } from "zustand/react/shallow";
import { columnNames } from "../constants";
import type { PipelineDeployment } from "../types";

export const useColumns = (): TableColumn<PipelineDeployment>[] => {
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));

  return React.useMemo(
    () => [
      {
        id: columnNames.DEPLOYMENT,
        label: "Deployment",
        data: {
          render: ({ data }) => {
            return (
              <Button variant="link" asChild className="h-auto p-0 text-sm font-medium">
                <Link
                  to={PATH_CDPIPELINE_DETAILS_FULL}
                  params={{
                    clusterName,
                    namespace: data.namespace,
                    name: data.pipelineName,
                  }}
                >
                  <ENTITY_ICON.deployment className="text-muted-foreground/70 mr-1.5 shrink-0" />
                  {data.pipelineName}
                </Link>
              </Button>
            );
          },
        },
        cell: {
          baseWidth: 40,
        },
      },
      {
        id: columnNames.ENVIRONMENTS,
        label: "Environments",
        data: {
          render: ({ data }) => {
            const deployedCount = data.argoApps.size;
            const totalCount = data.totalStages;

            return (
              <span className="text-muted-foreground text-sm">
                {deployedCount} / {totalCount} environments
              </span>
            );
          },
        },
        cell: {
          baseWidth: 60,
        },
      },
    ],
    [clusterName]
  );
};
