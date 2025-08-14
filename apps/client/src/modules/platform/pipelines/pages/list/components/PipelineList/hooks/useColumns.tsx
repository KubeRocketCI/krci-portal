import React from "react";
import { Pipeline } from "@my-project/shared";
import { TableColumn } from "@/core/components/Table/types";
import { Box, IconButton, Tooltip } from "@mui/material";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { PipelineGraphDialog } from "@/modules/platform/pipelines/dialogs/PipelineGraph";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { VectorSquare } from "lucide-react";
import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { TABLE } from "@/k8s/constants/tables";
import { getSyncedColumnData } from "@/core/components/Table/components/TableSettings/utils";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { routePipelineDetails } from "@/modules/platform/pipelines/pages/details/route";
import { Link } from "@tanstack/react-router";
import { Button } from "@/core/components/ui/button";
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
                  <TextWithTooltip text={name} />
                </Link>
              </Button>
            );
          },
        },
        cell: {
          isFixed: true,
          ...getSyncedColumnData(tableSettings, "name", 40),
        },
      },
      {
        id: "description",
        label: "Description",
        data: {
          render: ({ data }) => {
            const description = data.spec?.description || data.spec?.displayName || "No description available";

            return (
              <Box>
                <TextWithTooltip text={description} />
              </Box>
            );
          },
        },
        cell: {
          isFixed: false,
          ...getSyncedColumnData(tableSettings, "description", 50),
        },
      },
      {
        id: "diagram",
        label: "Diagram",
        data: {
          render: ({ data }) => {
            return (
              <Tooltip title="View Pipeline Diagram">
                <IconButton
                  onClick={() =>
                    openPipelineGraphDialog({
                      pipelineName: data.metadata.name,
                      namespace: data.metadata.namespace || "",
                    })
                  }
                  size="medium"
                >
                  <VectorSquare size={16} />
                </IconButton>
              </Tooltip>
            );
          },
        },
        cell: {
          isFixed: true,
          ...getSyncedColumnData(tableSettings, "diagram", 5),
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
          customizable: false,
          ...getSyncedColumnData(tableSettings, "actions", 5),
        },
      },
    ],
    [openPipelineGraphDialog, tableSettings, clusterName, defaultNamespace]
  );
};
