import React from "react";
import { Pipeline } from "@my-project/shared";
import { TableColumn } from "@/core/components/Table/types";
import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { PipelineGraphDialog } from "@/modules/platform/tekton/dialogs/PipelineGraph";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { VectorSquare } from "lucide-react";
import { ENTITY_ICON } from "@/k8s/constants/entity-icons";
import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { TABLE } from "@/k8s/constants/tables";
import { getSyncedColumnData } from "@/core/components/Table/components/TableSettings/utils";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { routePipelineDetails } from "@/modules/platform/tekton/pages/pipeline-details/route";
import { Link } from "@tanstack/react-router";
import { Actions } from "../components/Actions";

export const useColumns = (): TableColumn<Pipeline>[] => {
  const openPipelineGraphDialog = useDialogOpener(PipelineGraphDialog);

  const { loadSettings } = useTableSettings(TABLE.PIPELINE_LIST.id);
  const tableSettings = loadSettings();

  const { namespace: defaultNamespace, clusterName } = useClusterStore(
    useShallow((state) => ({
      namespace: state.defaultNamespace,
      clusterName: state.clusterName,
    }))
  );

  return React.useMemo(
    () => [
      {
        id: "name",
        label: "Name",
        data: {
          columnSortableValuePath: "metadata.name",
          render: ({ data }) => {
            const {
              metadata: { name, namespace },
            } = data;

            return (
              <Button variant="link" asChild className="p-0">
                <Link
                  to={routePipelineDetails.fullPath}
                  params={{
                    clusterName,
                    namespace: namespace || defaultNamespace,
                    name,
                  }}
                >
                  <ENTITY_ICON.pipeline className="text-muted-foreground/70" />
                  <TextWithTooltip text={name} />
                </Link>
              </Button>
            );
          },
        },
        cell: {
          isFixed: true,
          baseWidth: 40,
          ...getSyncedColumnData(tableSettings, "name"),
        },
      },
      {
        id: "description",
        label: "Description",
        data: {
          render: ({ data }) => {
            const description = data.spec?.description || data.spec?.displayName || "No description available";

            return <TextWithTooltip text={description} />;
          },
        },
        cell: {
          isFixed: false,
          baseWidth: 50,
          ...getSyncedColumnData(tableSettings, "description"),
        },
      },
      {
        id: "diagram",
        label: "Diagram",
        data: {
          render: ({ data }) => {
            return (
              <Tooltip title="View Pipeline Diagram">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    openPipelineGraphDialog({
                      pipelineName: data.metadata.name,
                      namespace: data.metadata.namespace || "",
                    })
                  }
                >
                  <VectorSquare size={16} />
                </Button>
              </Tooltip>
            );
          },
        },
        cell: {
          isFixed: true,
          baseWidth: 5,
          ...getSyncedColumnData(tableSettings, "diagram"),
        },
      },
      {
        id: "actions",
        label: "Actions",
        data: {
          render: ({ data }) => <Actions pipeline={data} />,
        },
        cell: {
          isFixed: true,
          baseWidth: 5,
          ...getSyncedColumnData(tableSettings, "actions"),
        },
      },
    ],
    [openPipelineGraphDialog, tableSettings, clusterName, defaultNamespace]
  );
};
