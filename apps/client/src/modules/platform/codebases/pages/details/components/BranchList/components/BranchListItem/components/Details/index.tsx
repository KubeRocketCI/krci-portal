import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { FilterProvider } from "@/core/providers/Filter/provider";
import { TABLE } from "@/k8s/constants/tables";
import { PipelineRunList } from "@/modules/platform/pipelineruns/components/PipelineRunList";
import {
  matchFunctions,
  pipelineRunFilterControlNames,
} from "@/modules/platform/pipelineruns/components/PipelineRunList/components/Filter/constants";
import { PipelineRunListFilterValues } from "@/modules/platform/pipelineruns/components/PipelineRunList/components/Filter/types";
import { PipelineRun, pipelineType } from "@my-project/shared";
import { DetailsProps } from "./types";

export const Details = ({ pipelineRuns }: DetailsProps) => {
  const { loadSettings } = useTableSettings(TABLE.BRANCH_PIPELINE_RUN_LIST.id);

  const tableSettings = loadSettings();

  return (
    <div className="mt-5">
      <div>
        <div className="mb-4 flex flex-col items-start gap-4">
          <div>
            <h6 className="text-base font-medium">Pipeline Runs</h6>
          </div>
          <div className="w-full">
            <FilterProvider<PipelineRun, PipelineRunListFilterValues>
              matchFunctions={matchFunctions}
              syncWithUrl
              defaultValues={{
                [pipelineRunFilterControlNames.NAMESPACES]: [],
                [pipelineRunFilterControlNames.CODEBASES]: [],
                [pipelineRunFilterControlNames.STATUS]: "all",
                [pipelineRunFilterControlNames.PIPELINE_TYPE]: "all",
              }}
            >
              <PipelineRunList
                pipelineRuns={pipelineRuns!}
                isLoading={pipelineRuns === null}
                pipelineRunTypes={[pipelineType.review, pipelineType.build]}
                filterControls={[pipelineRunFilterControlNames.PIPELINE_TYPE, pipelineRunFilterControlNames.STATUS]}
                tableId={TABLE.BRANCH_PIPELINE_RUN_LIST.id}
                tableName={TABLE.BRANCH_PIPELINE_RUN_LIST.name}
                tableSettings={tableSettings}
              />
            </FilterProvider>
          </div>
        </div>
      </div>
    </div>
  );
};
