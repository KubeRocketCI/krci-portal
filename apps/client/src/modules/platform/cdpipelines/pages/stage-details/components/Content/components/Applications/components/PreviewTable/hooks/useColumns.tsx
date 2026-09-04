import { TableColumn } from "@/core/components/Table/types";
import { StageAppCodebaseCombinedData, useStageWatch } from "@/modules/platform/cdpipelines/pages/stage-details/hooks";
import { inClusterName } from "@my-project/shared";
import { columnNames } from "../../../constants";
import { DeployedVersionPreviewColumn } from "../../columns/DeployedVersionPreview";
import { IngressColumnLive } from "../../columns/IngressLive";
import { IngressHeadColumn } from "../../columns/IngressHead";
import { NameColumn } from "../../columns/Name";
import { PodsColumn } from "../../columns/Pods";
import { StatusColumn } from "../../columns/Status";
import { ValuesOverridePreviewColumn } from "../../columns/ValuesOverridePreview";
import { ValuesOverridePreviewHeadColumn } from "../../columns/ValuesOverridePreviewHead";

export const useColumns = (): TableColumn<StageAppCodebaseCombinedData>[] => {
  const stageWatch = useStageWatch();

  const stage = stageWatch.query.data;

  const shouldShowPodsColumn = stage?.spec.clusterName === inClusterName;

  return [
    {
      id: columnNames.NAME,
      label: "Application",
      data: {
        render: ({ data: { appCodebase } }) => <NameColumn appCodebase={appCodebase} />,
      },
      cell: {
        baseWidth: 25,
      },
    },
    {
      id: columnNames.STATUS,
      label: "Status",
      data: {
        render: ({ data: { application } }) => <StatusColumn application={application} />,
      },
      cell: {
        baseWidth: 35,
      },
    },
    {
      id: columnNames.DEPLOYED_VERSION,
      label: "Deployed Version",
      data: {
        render: ({ data: { application, appCodebase } }) => (
          <DeployedVersionPreviewColumn appCodebase={appCodebase} application={application!} />
        ),
      },
      cell: {
        baseWidth: 25,
      },
    },
    {
      id: columnNames.VALUES_OVERRIDE,
      label: <ValuesOverridePreviewHeadColumn />,
      data: {
        render: ({ data: { appCodebase } }) => <ValuesOverridePreviewColumn appCodebase={appCodebase} />,
      },
      cell: {
        baseWidth: 15,
      },
    },
    ...(shouldShowPodsColumn
      ? ([
          {
            id: columnNames.PODS,
            label: "Pods",
            data: {
              render: ({ data: { appCodebase, application } }) => (
                <PodsColumn appCodebase={appCodebase} application={application} />
              ),
            },
            cell: {
              baseWidth: 10,
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
        render: ({ data: { application, appCodebase } }) => (
          <IngressColumnLive application={application} appName={appCodebase.metadata.name} />
        ),
      },
      cell: {
        baseWidth: 10,
        props: {
          align: "center",
        },
      },
    },
  ];
};
