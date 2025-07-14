import React from "react";
import { Overview } from "../components/Overview";
import { Tab } from "@/core/providers/Tabs/components/Tabs/types";
import { Applications } from "../components/Applications";
import { Variables } from "../components/Variables";
import { Monitoring } from "../components/Monitoring";

export const usePageTabs = (): Tab[] => {
  return React.useMemo(() => {
    return [
      {
        label: "Overview",
        id: "overview",
        component: <Overview />,
      },
      {
        label: "Applications",
        id: "applications",
        component: <Applications />,
      },
      {
        label: "Pipelines",
        id: "pipelines",
        component: (
          // <LoadingWrapper isLoading={_isLoading}>
          //   <TabSection title="Pipelines">
          //     <FilterContextProvider
          //       entityID={`PIPELINE_RUN_LIST_STAGE_DETAILS::${getDefaultNamespace()}`}
          //       matchFunctions={matchFunctions}
          //       saveToLocalStorage
          //     >
          //       <PipelineRunList
          //         tableId={TABLE.STAGE_PIPELINE_RUN_LIST.id}
          //         tableName={TABLE.STAGE_PIPELINE_RUN_LIST.name}
          //         pipelineRuns={pipelineRuns.data!}
          //         isLoading={pipelineRuns.isLoading && !pipelineRuns.error}
          //         blockerError={pipelineRuns.error}
          //         permissions={permissions}
          //         pipelineRunTypes={[PIPELINE_TYPE.ALL, PIPELINE_TYPE.DEPLOY, PIPELINE_TYPE.CLEAN]}
          //         filterControls={[
          //           pipelineRunFilterControlNames.PIPELINE_TYPE,
          //           pipelineRunFilterControlNames.STATUS,
          //         ]}
          //       />
          //     </FilterContextProvider>
          //   </TabSection>
          // </LoadingWrapper>
          <>test</>
        ),
        // highlightNew: newPipelineRunAdded,
      },
      {
        label: "Variables",
        id: "variables",
        component: <Variables />,
      },
      {
        label: "Monitoring",
        id: "monitoring",
        component: <Monitoring />,
      },
    ];
  }, []);
};
