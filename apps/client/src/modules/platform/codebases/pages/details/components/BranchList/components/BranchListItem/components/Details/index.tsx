import { Grid, Typography } from "@mui/material";

import { useTableSettings } from "@/core/components/Table/components/TableSettings/hooks/useTableSettings";
import { TABLE } from "@/k8s/constants/tables";
import { FilterProvider } from "@/core/providers/Filter/provider";
import { ResourceActionListContextProvider } from "@/core/providers/ResourceActionList/provider";
import { useClusterStore } from "@/k8s/store";
import { PipelineRunList } from "@/modules/platform/pipelines/components/PipelineRunList";
import {
  matchFunctions,
  pipelineRunFilterControlNames,
} from "@/modules/platform/pipelines/components/PipelineRunList/constants";
import { pipelineType } from "@my-project/shared";
import { useShallow } from "zustand/react/shallow";
import { DetailsProps } from "./types";

export const Details = ({ pipelineRuns }: DetailsProps) => {
  const defaultNamespace = useClusterStore(useShallow((state) => state.defaultNamespace));

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
              <FilterProvider
                entityID={`PIPELINE_RUN_LIST_BRANCH_DETAILS::${defaultNamespace}`}
                matchFunctions={matchFunctions}
                saveToLocalStorage
              >
                <PipelineRunList
                  pipelineRuns={pipelineRuns!}
                  isLoading={pipelineRuns === null}
                  pipelineRunTypes={["all", pipelineType.review, pipelineType.build]}
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
