import { Accordion, AccordionDetails, AccordionSummary, alpha, Box } from "@mui/material";
import {
  PipelineRunDraft,
  pipelineRunLabels,
  pipelineType,
  sortKubeObjectByCreationTimestamp,
} from "@my-project/shared";
import { ChevronDown } from "lucide-react";
import React from "react";
import { useCodebaseBranchPipelineRunListWatch } from "../../../../hooks/data";
import { Details } from "./components/Details";
import { Summary } from "./components/Summary";
import { BranchListItemProps } from "./types";

export const BranchListItem = ({ codebaseBranch, expandedPanel, id, handlePanelChange }: BranchListItemProps) => {
  const pipelineRunListWatch = useCodebaseBranchPipelineRunListWatch(codebaseBranch);

  const pipelineRuns = React.useMemo(() => {
    const allItems = pipelineRunListWatch.dataArray.sort(sortKubeObjectByCreationTimestamp);
    return {
      all: allItems,
      latestBuildPipelineRun: allItems.find(
        (el) => el.metadata.labels?.[pipelineRunLabels.pipelineType] === pipelineType.build
      ),
    };
  }, [pipelineRunListWatch.dataArray]);

  // const { createPipelineRun } = usePipelineRunCRUD();

  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClickMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(menuAnchorEl ? null : event.currentTarget);
  };

  const handleCloseMenu = () => setMenuAnchorEl(null);

  const [, setEditor] = React.useState<{
    open: boolean;
    data: PipelineRunDraft | undefined;
  }>({
    open: false,
    data: undefined,
  });

  const handleOpenEditor = (data: PipelineRunDraft) => {
    setEditor({ open: true, data });
  };

  // const handleCloseEditor = () => {
  //   setEditor({ open: false, data: undefined });
  // };

  // const handleEditorSave = async (data: PipelineRunDraft[]) => {
  //   const [item] = data;

  //   handleCloseMenu();

  //   await createPipelineRun({
  //     pipelineRun: item,
  //   });

  //   handleCloseEditor();
  // };

  return (
    <>
      <Box sx={{ pb: (t) => t.typography.pxToRem(16) }}>
        <Accordion expanded={expandedPanel === id} onChange={handlePanelChange(id)}>
          <AccordionSummary
            expandIcon={<ChevronDown size={16} />}
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
              codebaseBranch={codebaseBranch}
              latestBuildPipelineRun={pipelineRuns.latestBuildPipelineRun}
              menuAnchorEl={menuAnchorEl}
              handleClickMenu={handleClickMenu}
              handleCloseMenu={handleCloseMenu}
              handleOpenEditor={handleOpenEditor}
            />
          </AccordionSummary>
          <AccordionDetails>
            <Details pipelineRuns={pipelineRuns.all} />
          </AccordionDetails>
        </Accordion>
      </Box>
    </>
  );
};
