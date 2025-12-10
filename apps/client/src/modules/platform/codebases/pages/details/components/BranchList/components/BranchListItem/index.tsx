import { AccordionContent, AccordionItem, AccordionTrigger } from "@/core/components/ui/accordion";
import { pipelineRunLabels, pipelineType, sortKubeObjectByCreationTimestamp } from "@my-project/shared";
import React from "react";
import { useCodebaseBranchPipelineRunListWatch } from "../../../../hooks/data";
import { Details } from "./components/Details";
import { Summary } from "./components/Summary";
import { BranchListItemProps } from "./types";

export const BranchListItem = React.memo<BranchListItemProps>(({ codebaseBranch, id }) => {
  const pipelineRunListWatch = useCodebaseBranchPipelineRunListWatch(codebaseBranch);

  const pipelineRuns = React.useMemo(() => {
    const allItems = [...pipelineRunListWatch.data.array].sort(sortKubeObjectByCreationTimestamp);
    return {
      all: allItems,
      latestBuildPipelineRun: allItems.find(
        (el) => el.metadata.labels?.[pipelineRunLabels.pipelineType] === pipelineType.build
      ),
    };
  }, [pipelineRunListWatch.data.array]);

  return (
    <AccordionItem value={id}>
      <AccordionTrigger>
        <Summary codebaseBranch={codebaseBranch} latestBuildPipelineRun={pipelineRuns.latestBuildPipelineRun} />
      </AccordionTrigger>
      <AccordionContent>
        <Details pipelineRuns={pipelineRuns.all} />
      </AccordionContent>
    </AccordionItem>
  );
});
