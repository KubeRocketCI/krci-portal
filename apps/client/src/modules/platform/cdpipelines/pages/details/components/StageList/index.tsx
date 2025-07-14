import { EmptyList } from "@/core/components/EmptyList";
import { HorizontalScrollContainer } from "@/core/components/HorizontalScrollContainer";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { ManageStageDialog } from "@/modules/platform/cdpipelines/dialogs/ManageStage";
import { Grid, useTheme } from "@mui/material";
import { Table } from "lucide-react";
import React from "react";
import { useCDPipelineWatch, useStagesWithItsApplicationsWatch } from "../../hooks/data";
import { usePageFilterContext } from "../../hooks/usePageFilterContext";
import { Stage } from "./components/Stage";

export const StageList = () => {
  const theme = useTheme();

  const cdPipelineWatch = useCDPipelineWatch();

  const stagesWithItsApplicationsWatch = useStagesWithItsApplicationsWatch();

  const { filterFunction } = usePageFilterContext();

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

  console.log(stagesWithItsApplicationsWatch, filteredStages);

  const openManageStageDialog = useDialogOpener(ManageStageDialog);

  const renderPageContent = React.useCallback(() => {
    const isLoading =
      cdPipelineWatch.query.isLoading ||
      stagesWithItsApplicationsWatch.isLoading ||
      !stagesWithItsApplicationsWatch.isSuccess;

    if (filteredStages?.length === 0 && !isLoading) {
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
      <LoadingWrapper isLoading={isLoading}>
        <HorizontalScrollContainer>
          <Grid container spacing={6} wrap="nowrap" sx={{ pb: theme.typography.pxToRem(50) }}>
            {filteredStages.map((stageWithApplications) => {
              return (
                <Grid item xs={6} flexShrink="0" key={stageWithApplications.stage.spec.name}>
                  <Stage stageWithApplications={stageWithApplications} />
                </Grid>
              );
            })}
          </Grid>
        </HorizontalScrollContainer>
      </LoadingWrapper>
    );
  }, [
    cdPipelineWatch.query.data,
    cdPipelineWatch.query.isLoading,
    filteredStages,
    openManageStageDialog,
    stagesWithItsApplicationsWatch.data,
    stagesWithItsApplicationsWatch.isLoading,
    stagesWithItsApplicationsWatch.isSuccess,
    theme.typography,
  ]);

  return renderPageContent();
};
