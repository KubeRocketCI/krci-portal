import { EmptyList } from "@/core/components/EmptyList";
import { HorizontalScrollContainer } from "@/core/components/HorizontalScrollContainer";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { ManageStageDialog } from "@/modules/platform/cdpipelines/dialogs/ManageStage";
import { useTheme } from "@mui/material";
import { Table } from "lucide-react";
import React from "react";
import { useCDPipelineWatch, useStagesWithItsApplicationsWatch } from "../../hooks/data";
import { Stage } from "./components/Stage";
import { useStageFilter } from "../StageListFilter/hooks/useStageFilter";

export const StageList = () => {
  const theme = useTheme();

  const cdPipelineWatch = useCDPipelineWatch();

  const stagesWithItsApplicationsWatch = useStagesWithItsApplicationsWatch();

  const { filterFunction } = useStageFilter();

  const filteredStages = React.useMemo(() => {
    if (
      !stagesWithItsApplicationsWatch.isSuccess ||
      !stagesWithItsApplicationsWatch.data?.stagesWithItsApplications?.length
    ) {
      return [];
    }

    const result = stagesWithItsApplicationsWatch.data.stagesWithItsApplications.filter(filterFunction);
    return result;
  }, [stagesWithItsApplicationsWatch, filterFunction]);

  const openManageStageDialog = useDialogOpener(ManageStageDialog);

  const renderPageContent = React.useCallback(() => {
    const isLoading = cdPipelineWatch.query.isLoading || stagesWithItsApplicationsWatch.isLoading;

    if (!isLoading && stagesWithItsApplicationsWatch.data?.stages.length === 0) {
      return (
        <EmptyList
          missingItemName="Environments"
          icon={<Table size={theme.typography.pxToRem(128)} />}
          linkText={"by adding a new one here."}
          beforeLinkText="Take the first step towards managing your Environment"
          handleClick={() => {
            openManageStageDialog({
              cdPipeline: cdPipelineWatch.query.data!,
              otherStages: stagesWithItsApplicationsWatch.data?.stages || [],
            });
          }}
        />
      );
    }

    return (
      <HorizontalScrollContainer>
        <div className="flex gap-12 w-1/3" style={{ paddingBottom: theme.typography.pxToRem(50) }}>
          {filteredStages.map((stageWithApplications) => {
            return (
              <div className="shrink-0 w-full" key={stageWithApplications.stage.spec.name}>
                <Stage stageWithApplications={stageWithApplications} />
              </div>
            );
          })}
        </div>
      </HorizontalScrollContainer>
    );
  }, [
    cdPipelineWatch.query.data,
    cdPipelineWatch.query.isLoading,
    filteredStages,
    openManageStageDialog,
    stagesWithItsApplicationsWatch.data,
    stagesWithItsApplicationsWatch.isLoading,
    theme.typography,
  ]);

  return renderPageContent();
};
