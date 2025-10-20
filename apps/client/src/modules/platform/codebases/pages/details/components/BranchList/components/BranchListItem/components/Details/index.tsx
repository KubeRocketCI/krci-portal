import { Grid, Typography } from "@mui/material";

import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { FilterProvider } from "@/core/providers/Filter/provider";
import { ResourceActionListContextProvider } from "@/core/providers/ResourceActionList/provider";
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
    <Grid container spacing={4} sx={{ mt: (t) => t.typography.pxToRem(20) }}>
      <Grid item xs={12}>
        <Grid container spacing={2} alignItems={"flex-end"}>
          <Grid item>
            <Typography variant={"h6"}>Pipeline Runs</Typography>
          </Grid>
          <Grid item xs={12}>
            <ResourceActionListContextProvider>
              <FilterProvider<PipelineRun, PipelineRunListFilterValues>
                matchFunctions={matchFunctions}
                syncWithUrl
                defaultValues={{
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
            </ResourceActionListContextProvider>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};
