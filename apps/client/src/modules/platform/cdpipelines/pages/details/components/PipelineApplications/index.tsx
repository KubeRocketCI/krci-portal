import React from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/core/components/ui/button";
import { DataTable } from "@/core/components/Table";
import { TableColumn } from "@/core/components/Table/types";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { Box } from "lucide-react";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { getCodebaseMappingByType } from "@/k8s/api/groups/KRCI/Codebase";
import { CodebaseInterface } from "@/k8s/api/groups/KRCI/Codebase/configs/mappings/types";
import { Codebase } from "@my-project/shared";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { PATH_COMPONENT_DETAILS_FULL } from "@/modules/platform/codebases/pages/details/route";
import { useCDPipelineWatch, useAppCodebaseListWatch } from "../../hooks/data";
import { routeCDPipelineDetails } from "../../route";

const TABLE_ID = "pipelineApplicationsList";

const useColumns = (clusterName: string, namespace: string): TableColumn<Codebase>[] => {
  return React.useMemo(
    () => [
      {
        id: "application",
        label: "Application",
        data: {
          render: ({ data }) => (
            <Button variant="link" asChild className="text-foreground h-auto justify-start p-0 text-sm">
              <Link
                to={PATH_COMPONENT_DETAILS_FULL}
                params={{
                  clusterName,
                  name: data.metadata.name,
                  namespace: data.metadata.namespace || namespace,
                }}
              >
                <Box className="size-4 shrink-0" />
                {data.metadata.name}
              </Link>
            </Button>
          ),
        },
        cell: {
          baseWidth: 25,
        },
      },
      {
        id: "language",
        label: "Language / Framework",
        data: {
          render: ({ data }) => {
            const type = data.spec.type;
            const lang = data.spec.lang?.toLowerCase() || "";
            const framework = data.spec.framework?.toLowerCase() || "";

            const codebaseMapping = getCodebaseMappingByType(type) as Record<string, CodebaseInterface>;
            const codebaseMappingByLang = codebaseMapping?.[lang];

            return (
              <div className="flex flex-col gap-0.5">
                <div className="text-foreground text-sm">
                  {codebaseMappingByLang?.language?.name || capitalizeFirstLetter(data.spec.lang || "")}
                </div>
                <div className="text-muted-foreground text-xs">
                  {framework
                    ? codebaseMappingByLang?.frameworks?.[framework]?.name || capitalizeFirstLetter(framework)
                    : "N/A"}
                </div>
              </div>
            );
          },
        },
        cell: {
          baseWidth: 20,
        },
      },
      {
        id: "buildTool",
        label: "Build Tool",
        data: {
          render: ({ data }) => {
            const type = data.spec.type;
            const lang = data.spec.lang?.toLowerCase() || "";
            const buildTool = data.spec.buildTool?.toLowerCase() || "";

            const codebaseMapping = getCodebaseMappingByType(type) as Record<string, CodebaseInterface>;
            const codebaseMappingByLang = codebaseMapping?.[lang];

            return (
              <div className="text-foreground text-sm">
                {codebaseMappingByLang?.buildTools?.[buildTool]?.name ||
                  capitalizeFirstLetter(data.spec.buildTool || "")}
              </div>
            );
          },
        },
        cell: {
          baseWidth: 15,
        },
      },
      {
        id: "description",
        label: "Description",
        data: {
          render: ({ data }) => <TextWithTooltip text={data.spec.description || "No description"} maxLineAmount={1} />,
        },
        cell: {
          baseWidth: 40,
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
