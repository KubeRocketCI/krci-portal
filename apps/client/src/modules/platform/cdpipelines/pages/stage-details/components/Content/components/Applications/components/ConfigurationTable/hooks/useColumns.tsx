import { TableColumn } from "@/core/components/Table/types";
import { TABLE } from "@/k8s/constants/tables";
import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { getSyncedColumnData } from "@/core/components/Table/components/TableSettings/utils";
import { columnNames } from "../../../constants";
import { HealthColumn } from "../../columns/Health";
import { IngressColumn } from "../../columns/Ingress";
import { IngressHeadColumn } from "../../columns/IngressHead";
import { NameColumn } from "../../columns/Name";
import { PodsColumn } from "../../columns/Pods";
import { SyncColumn } from "../../columns/Sync";
import { inClusterName } from "@my-project/shared";
import { StageAppCodebaseCombinedData, useStageWatch } from "@/modules/platform/cdpipelines/pages/stage-details/hooks";
import { DeployedVersionConfigurationColumn } from "../../columns/DeployedVersionConfiguration";
import { DeployedVersionConfigurationHeadColumn } from "../../columns/DeployedVersionConfigurationHead";
import { ValuesOverrideConfigurationColumn } from "../../columns/ValuesOverrideConfiguration";
import { ValuesOverrideConfigurationHeadColumn } from "../../columns/ValuesOverrideConfigurationHead";

export const useColumns = (): TableColumn<StageAppCodebaseCombinedData>[] => {
  const { loadSettings } = useTableSettings(TABLE.STAGE_APPLICATION_LIST_PREVIEW.id);
  const tableSettings = loadSettings();

  const stageWatch = useStageWatch();

  const stage = stageWatch.query.data;

  const shouldShowPodsColumn = stage?.spec.clusterName === inClusterName;

  return [
    {
      id: columnNames.EMPTY,
      label: "",
      data: {
        render: () => null,
      },
      cell: {
        show: true,
        baseWidth: 5,
      },
    },
    {
      id: columnNames.HEALTH,
      label: "Health",
      data: {
        render: ({ data: { application } }) => <HealthColumn application={application!} />,
      },
      cell: {
        isFixed: true,
        baseWidth: 5,
        ...getSyncedColumnData(tableSettings, columnNames.HEALTH),
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
        baseWidth: 5,
        ...getSyncedColumnData(tableSettings, columnNames.SYNC),
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
        baseWidth: 25,
        ...getSyncedColumnData(tableSettings, columnNames.NAME),
      },
    },
    {
      id: columnNames.DEPLOYED_VERSION,
      label: <DeployedVersionConfigurationHeadColumn />,
      data: {
        render: ({ data }) => {
          return <DeployedVersionConfigurationColumn stageAppCodebasesCombinedData={data} />;
        },
      },
      cell: {
        baseWidth: 25,
        ...getSyncedColumnData(tableSettings, columnNames.DEPLOYED_VERSION),
      },
    },
    {
      id: columnNames.VALUES_OVERRIDE,
      label: <ValuesOverrideConfigurationHeadColumn />,
      data: {
        render: ({ data: { application, appCodebase } }) => (
          <ValuesOverrideConfigurationColumn application={application!} appCodebase={appCodebase} />
        ),
      },
      cell: {
        baseWidth: 15,
        ...getSyncedColumnData(tableSettings, columnNames.VALUES_OVERRIDE),
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
              baseWidth: 10,
              ...getSyncedColumnData(tableSettings, columnNames.PODS),
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
        baseWidth: 10,
        ...getSyncedColumnData(tableSettings, columnNames.INGRESS),
        props: {
          align: "center",
        },
      },
    },
  ];
};
