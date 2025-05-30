import { useCodebaseWatchItem } from "@/core/k8s/api/groups/KRCI/Codebase";
import { usePipelineRunWatchList } from "@/core/k8s/api/groups/Tekton/PipelineRun";
import { Accordion, AccordionDetails, AccordionSummary, alpha, Box } from "@mui/material";
import { pipelineRunLabels, pipelineType, sortKubeObjectByCreationTimestamp } from "@my-project/shared";
import { useParams } from "@tanstack/react-router";
import { ArrowDown } from "lucide-react";
import React from "react";
import { routeComponentDetails } from "../../../../route";
import { Details } from "./components/Details";
import { Summary } from "./components/Summary";
import { CodebaseBranchProps } from "./types";

export const BranchListItem = ({ codebaseBranch, expandedPanel, id, handlePanelChange }: CodebaseBranchProps) => {
  const params = useParams({
    from: routeComponentDetails.id,
  });

  // const { setDialog } = useDialogContext();

  const codebaseWatchQuery = useCodebaseWatchItem({
    name: params.name,
    queryOptions: {
      enabled: !!params.name,
    },
  });
  const codebase = codebaseWatchQuery.data;

  const pipelineRunListWatch = usePipelineRunWatchList({
    namespace: codebaseBranch.metadata.namespace,
    labels: {
      [pipelineRunLabels.codebaseBranch]: codebaseBranch.metadata.name,
    },
  });

  const pipelineRuns = React.useMemo(() => {
    const allItems = pipelineRunListWatch.dataArray.sort(sortKubeObjectByCreationTimestamp);
    return {
      all: allItems,
      latestBuildPipelineRun: allItems.filter(
        (el) => el.metadata.labels?.[pipelineRunLabels.pipelineType] === pipelineType.build
      ),
    };
  }, [pipelineRunListWatch.dataArray]);

  // const { createBuildPipelineRun } = useCreateBuildPipelineRun({});

  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClickMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(menuAnchorEl ? null : event.currentTarget);
  };

  const handleCloseMenu = () => setMenuAnchorEl(null);

  // const [editor, setEditor] = React.useState<{
  //   open: boolean;
  //   data: KubeObjectInterface | undefined;
  // }>({
  //   open: false,
  //   data: undefined,
  // });

  // const handleOpenEditor = (data: KubeObjectInterface) => {
  //   setEditor({ open: true, data });
  // };

  // const handleCloseEditor = () => {
  //   setEditor({ open: false, data: undefined });
  // };

  // const handleEditorSave = (data: KubeObjectInterface[]) => {
  //   const [item] = data;

  //   handleCloseMenu();

  //   createBuildPipelineRun(item);

  //   handleCloseEditor();
  // };

  return (
    <>
      <Box sx={{ pb: (t) => t.typography.pxToRem(16) }}>
        <Accordion expanded={expandedPanel === id} onChange={handlePanelChange(id)}>
          <AccordionSummary
            expandIcon={<ArrowDown size={16} />}
            sx={{
              padding: (t) => `${t.typography.pxToRem(8)} ${t.typography.pxToRem(24)}`,
              borderBottom: (t) => `1px solid ${alpha(t.palette.common.black, 0.2)}`,

              "& .MuiAccordionSummary-content": {
                margin: 0,
              },
              "& .MuiAccordionSummary-content.Mui-expanded": {
                margin: 0,
              },
            }}
          >
            <Summary
              codebaseBranchData={codebaseBranchData}
              latestBuildPipelineRun={pipelineRuns.latestBuildPipelineRun}
              createBuildPipelineRun={createBuildPipelineRun}
              menuAnchorEl={menuAnchorEl}
              handleClickMenu={handleClickMenu}
              handleCloseMenu={handleCloseMenu}
              handleOpenEditor={handleOpenEditor}
            />
          </AccordionSummary>
          <AccordionDetails>
            <Details codebaseData={codebaseData!} pipelineRuns={pipelineRuns.all} error={error} />
          </AccordionDetails>
        </Accordion>
      </Box>
    </>
  );
};
