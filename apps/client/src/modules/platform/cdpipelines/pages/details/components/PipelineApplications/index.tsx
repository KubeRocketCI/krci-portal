import React from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { DataTable } from "@/core/components/Table";
import { TableColumn } from "@/core/components/Table/types";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { ENTITY_ICON } from "@/k8s/constants/entity-icons";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { getCodebaseStatusIcon } from "@/k8s/api/groups/KRCI/Codebase";
import { ResourceStatusBadge } from "@/k8s/components/ResourceStatusBadge";
import { CodebaseLanguageIcon } from "@/modules/platform/codebases/components/CodebaseLanguageIcon";
import { CodebaseFrameworkIcon } from "@/modules/platform/codebases/components/CodebaseFrameworkIcon";
import { CodebaseBuildToolIcon } from "@/modules/platform/codebases/components/CodebaseBuildToolIcon";
import { Codebase } from "@my-project/shared";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { PATH_PROJECT_DETAILS_FULL } from "@/modules/platform/codebases/pages/details/route";
import { useCDPipelineWatch, useAppCodebaseListWatch } from "../../hooks/data";
import { routeCDPipelineDetails } from "../../route";

const TABLE_ID = "pipelineApplicationsList";

const useColumns = (clusterName: string, namespace: string): TableColumn<Codebase>[] => {
  return React.useMemo(
    () => [
      {
        id: "name",
        label: "Name",
        data: {
          columnSortableValuePath: "metadata.name",
          render: ({ data }) => (
            <Button variant="link" asChild className="px-4 py-0">
              <Link
                to={PATH_PROJECT_DETAILS_FULL}
                params={{
                  clusterName,
                  name: data.metadata.name,
                  namespace: data.metadata.namespace || namespace,
                }}
              >
                <span className="flex items-center gap-2">
                  <ENTITY_ICON.project className="text-muted-foreground/70" />
                  <TextWithTooltip text={data.metadata.name} />
                </span>
              </Link>
            </Button>
          ),
        },
        cell: {
          baseWidth: 20,
        },
      },
      {
        id: "status",
        label: "Status",
        data: {
          columnSortableValuePath: "status.status",
          render: ({ data }) => {
            const status = data?.status?.status;
            const detailedMessage = data?.status?.detailedMessage;
            const statusIcon = getCodebaseStatusIcon(data);

            return <ResourceStatusBadge status={status} detailedMessage={detailedMessage} statusIcon={statusIcon} />;
          },
        },
        cell: {
          baseWidth: 10,
        },
      },
      {
        id: "type",
        label: "Type",
        data: {
          columnSortableValuePath: "spec.type",
          render: ({ data }) => {
            return <Badge variant="outline">{capitalizeFirstLetter(data.spec.type)}</Badge>;
          },
        },
        cell: {
          baseWidth: 12,
        },
      },
      {
        id: "language",
        label: "Language",
        data: {
          render: ({ data }) => <CodebaseLanguageIcon codebase={data} />,
        },
        cell: {
          baseWidth: 12,
        },
      },
      {
        id: "framework",
        label: "Framework",
        data: {
          render: ({ data }) => <CodebaseFrameworkIcon codebase={data} />,
        },
        cell: {
          baseWidth: 12,
        },
      },
      {
        id: "buildTool",
        label: "Build Tool",
        data: {
          render: ({ data }) => <CodebaseBuildToolIcon codebase={data} />,
        },
        cell: {
          baseWidth: 12,
        },
      },
    ],
    [clusterName, namespace]
  );
};

export const PipelineApplications = () => {
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));
  const params = routeCDPipelineDetails.useParams();

  const cdPipelineWatch = useCDPipelineWatch();
  const appCodebaseListWatch = useAppCodebaseListWatch();

  const columns = useColumns(clusterName, params.namespace);

  // Filter app codebases to only those in the pipeline
  const pipelineApplications = React.useMemo(() => {
    const cdPipeline = cdPipelineWatch.data;
    if (!cdPipeline) return [];

    return appCodebaseListWatch.data.array.filter((appCodebase) =>
      cdPipeline.spec.applications.some((appName) => appName === appCodebase.metadata.name)
    );
  }, [cdPipelineWatch.data, appCodebaseListWatch.data.array]);

  const isLoading = cdPipelineWatch.isLoading || appCodebaseListWatch.isLoading;

  return (
    <DataTable<Codebase>
      id={TABLE_ID}
      name="Pipeline Applications"
      data={pipelineApplications}
      isLoading={isLoading}
      columns={columns}
      settings={{
        show: false,
      }}
      pagination={{
        show: false,
      }}
    />
  );
};
