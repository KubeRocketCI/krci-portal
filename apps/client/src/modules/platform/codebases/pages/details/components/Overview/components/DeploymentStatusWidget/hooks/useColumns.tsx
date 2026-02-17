import React from "react";
import { Link } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { StatusIcon } from "@/core/components/StatusIcon";
import { TableColumn } from "@/core/components/Table/types";
import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { getSyncedColumnData } from "@/core/components/Table/components/TableSettings/utils";
import { TABLE } from "@/k8s/constants/tables";
import { getApplicationStatusIcon, getApplicationSyncStatusIcon } from "@/k8s/api/groups/ArgoCD/Application";
import { useClusterStore } from "@/k8s/store";
import { PATH_CDPIPELINE_STAGE_DETAILS_FULL } from "@/modules/platform/cdpipelines/pages/stage-details/route";
import { Application, applicationLabels, getApplicationStatus, getApplicationSyncStatus } from "@my-project/shared";
import { useShallow } from "zustand/react/shallow";
import { columnNames } from "../constants";
import { ScrollCopyText } from "@/core/components/ScrollCopyText";

export const useColumns = (): TableColumn<Application>[] => {
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));
  const { loadSettings } = useTableSettings(TABLE.CODEBASE_DEPLOYMENTS.id);
  const tableSettings = loadSettings();

  return React.useMemo(
    () => [
      {
        id: columnNames.ENVIRONMENT,
        label: "Environment",
        data: {
          render: ({ data }) => {
            const pipeline = data.metadata?.labels?.[applicationLabels.pipeline];
            const stage = data.metadata?.labels?.[applicationLabels.stage];

            if (pipeline && stage) {
              return (
                <Link
                  to={PATH_CDPIPELINE_STAGE_DETAILS_FULL}
                  params={{
                    clusterName,
                    namespace: data.metadata.namespace!,
                    cdPipeline: pipeline,
                    stage,
                  }}
                  className="text-primary hover:underline"
                >
                  {pipeline} - {stage}
                </Link>
              );
            }

            return <span className="text-muted-foreground">{data.metadata.name}</span>;
          },
        },
        cell: {
          baseWidth: 40,
          ...getSyncedColumnData(tableSettings, columnNames.ENVIRONMENT),
        },
      },
      {
        id: columnNames.STATUS,
        label: "Status",
        data: {
          render: ({ data }) => {
            const healthStatus = getApplicationStatus(data);
            const syncStatus = getApplicationSyncStatus(data);
            const healthStatusIcon = getApplicationStatusIcon(data);
            const syncStatusIcon = getApplicationSyncStatusIcon(data);

            return (
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-1 rounded px-2 py-0.5 text-xs"
                  style={{ backgroundColor: `${healthStatusIcon.color}15`, color: healthStatusIcon.color }}
                >
                  <StatusIcon
                    Icon={healthStatusIcon.component}
                    color={healthStatusIcon.color}
                    isSpinning={healthStatusIcon.isSpinning}
                    width={12}
                  />
                  <span className="capitalize">{healthStatus.status}</span>
                </div>
                <div
                  className="flex items-center gap-1 rounded px-2 py-0.5 text-xs"
                  style={{ backgroundColor: `${syncStatusIcon.color}15`, color: syncStatusIcon.color }}
                >
                  <RefreshCw className="size-3" />
                  <span className="capitalize">{syncStatus.status}</span>
                </div>
              </div>
            );
          },
        },
        cell: {
          baseWidth: 35,
          ...getSyncedColumnData(tableSettings, columnNames.STATUS),
        },
      },
      {
        id: columnNames.VERSION,
        label: "Version",
        data: {
          columnSortableValuePath: "spec.source.targetRevision",
          render: ({ data }) => {
            const version = data.spec?.source?.targetRevision || "N/A";

            return <ScrollCopyText text={version} className="w-full max-w-full" />;
          },
        },
        cell: {
          baseWidth: 25,
          ...getSyncedColumnData(tableSettings, columnNames.VERSION),
        },
      },
    ],
    [clusterName, tableSettings]
  );
};
