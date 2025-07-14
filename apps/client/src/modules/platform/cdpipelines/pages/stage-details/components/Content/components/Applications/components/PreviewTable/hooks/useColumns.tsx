import { TableColumn } from "@/core/components/Table/types";
import { TABLE } from "@/core/k8s/constants/tables";
import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { getSyncedColumnData } from "@/core/components/Table/components/TableSettings/utils";
import { inClusterName } from "@my-project/shared";
import { StageAppCodebaseCombinedData, useStageWatch } from "@/modules/platform/cdpipelines/pages/stage-details/hooks";
import { columnNames } from "../../../constants";
import { DeployedVersionPreviewColumn } from "../../columns/DeployedVersionPreview";
import { DeployedVersionHeadColumn } from "../../columns/DeployedVersionPreviewHead";
import { HealthColumn } from "../../columns/Health";
import { IngressColumn } from "../../columns/Ingress";
import { IngressHeadColumn } from "../../columns/IngressHead";
import { NameColumn } from "../../columns/Name";
import { PodsColumn } from "../../columns/Pods";
import { SyncColumn } from "../../columns/Sync";
import { ValuesOverridePreviewColumn } from "../../columns/ValuesOverridePreview";
import { ValuesOverridePreviewHeadColumn } from "../../columns/ValuesOverridePreviewHead";

export const useColumns = (): TableColumn<StageAppCodebaseCombinedData>[] => {
  const { loadSettings } = useTableSettings(TABLE.STAGE_APPLICATION_LIST_PREVIEW.id);
  const tableSettings = loadSettings();

  const stageWatch = useStageWatch();

  const stage = stageWatch.query.data;

  const shouldShowPodsColumn = stage?.spec.clusterName === inClusterName;

  return [
    {
      id: columnNames.HEALTH,
      label: "Health",
      data: {
        render: ({ data: { application } }) => <HealthColumn application={application!} />,
      },
      cell: {
        isFixed: true,
        ...getSyncedColumnData(tableSettings, columnNames.HEALTH, 5),
        props: {
          align: "center",
        },
      },
    },
    {
      id: columnNames.SYNC,
      label: "Sync",
      data: {
        render: ({ data: { application } }) => <SyncColumn application={application!} />,
      },
      cell: {
        isFixed: true,
        ...getSyncedColumnData(tableSettings, columnNames.SYNC, 5),
        props: {
          align: "center",
        },
      },
    },
    {
      id: columnNames.NAME,
      label: "Application",
      data: {
        render: ({ data: { appCodebase } }) => <NameColumn appCodebase={appCodebase} />,
      },
      cell: {
        customizable: false,
        ...getSyncedColumnData(tableSettings, columnNames.NAME, 25),
      },
    },
    {
      id: columnNames.DEPLOYED_VERSION,
      label: <DeployedVersionHeadColumn />,
      data: {
        render: ({ data: { application, appCodebase } }) => (
          <DeployedVersionPreviewColumn appCodebase={appCodebase} application={application!} />
        ),
      },
      cell: {
        ...getSyncedColumnData(tableSettings, columnNames.DEPLOYED_VERSION, 25),
      },
    },
    {
      id: columnNames.VALUES_OVERRIDE,
      label: <ValuesOverridePreviewHeadColumn />,
      data: {
        render: ({ data: { application, appCodebase } }) => (
          <ValuesOverridePreviewColumn application={application!} appCodebase={appCodebase} />
        ),
      },
      cell: {
        ...getSyncedColumnData(tableSettings, columnNames.VALUES_OVERRIDE, 15),
      },
    },
    ...(shouldShowPodsColumn
      ? ([
          {
            id: columnNames.PODS,
            label: "Pods",
            data: {
              render: () => <PodsColumn />,
            },
            cell: {
              ...getSyncedColumnData(tableSettings, columnNames.PODS, 10),
              props: {
                align: "center",
              },
            },
          },
        ] as TableColumn<StageAppCodebaseCombinedData>[])
      : []),
    {
      id: columnNames.INGRESS,
      label: <IngressHeadColumn />,
      data: {
        render: ({ data: { application } }) => <IngressColumn application={application!} />,
      },
      cell: {
        ...getSyncedColumnData(tableSettings, columnNames.INGRESS, 10),
        props: {
          align: "center",
        },
      },
    },
  ];
};
