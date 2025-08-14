import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { getSyncedColumnData } from "@/core/components/Table/components/TableSettings/utils";
import { TableColumn } from "@/core/components/Table/types";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { Button } from "@/core/components/ui/button";
import { useClusterStore } from "@/k8s/store";
import { Link } from "@tanstack/react-router";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { routePipelineRunDetails } from "../../../../details/route";

export const useColumns = (): TableColumn<string>[] => {
  const { namespace: defaultNamespace, clusterName } = useClusterStore(
    useShallow((state) => ({
      namespace: state.defaultNamespace,
      clusterName: state.clusterName,
    }))
  );

  const { loadSettings } = useTableSettings("pipeline-run-history-of-pipeline");

  const tableSettings = loadSettings();

  return React.useMemo(
    () => [
      {
        id: "name",
        label: "Name",
        data: {
          render: ({ data: name }) => (
            <Button variant="link" asChild className="p-0">
              <Link
                to={routePipelineRunDetails.to}
                params={{
                  clusterName,
                  namespace: defaultNamespace,
                  name,
                }}
              >
                <TextWithTooltip text={name} />
              </Link>
            </Button>
          ),
        },
        cell: {
          customizable: false,
          ...getSyncedColumnData(tableSettings, "name", 20),
        },
      },
    ],
    [clusterName, defaultNamespace, tableSettings]
  );
};
