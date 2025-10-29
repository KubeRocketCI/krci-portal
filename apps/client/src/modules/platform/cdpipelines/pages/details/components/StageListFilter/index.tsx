import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { Autocomplete as FormAutocomplete } from "@/core/components/form/Autocomplete";
import { Select as FormSelect, SelectOption } from "@/core/components/form/Select";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { useViewModeContext } from "@/core/providers/ViewMode/hooks";
import { VIEW_MODES } from "@/core/providers/ViewMode/types";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { useStagePermissions } from "@/k8s/api/groups/KRCI/Stage";
import { ManageStageDialog } from "@/modules/platform/cdpipelines/dialogs/ManageStage";
import { IconButton, Tooltip, useTheme } from "@mui/material";
import { applicationHealthStatus } from "@my-project/shared";
import { Plus, Rows2, Rows3 } from "lucide-react";
import React from "react";
import { useCDPipelineWatch, useStagesWithItsApplicationsWatch } from "../../hooks/data";
import { useStageFilter } from "./hooks/useStageFilter";
import { stagesFilterControlNames } from "./constants";

export const StageListFilter = () => {
  const theme = useTheme();
  const cdPipelineWatch = useCDPipelineWatch();
  const stagesWithItsApplicationsWatch = useStagesWithItsApplicationsWatch();

  const stagePermissions = useStagePermissions();

  const openManageStageDialog = useDialogOpener(ManageStageDialog);

  const { form } = useStageFilter();

  const stageSelectOptions = React.useMemo(() => {
    if (!stagesWithItsApplicationsWatch.isSuccess || !stagesWithItsApplicationsWatch.data) return [];

    return stagesWithItsApplicationsWatch.data.stages.map((stage) => stage.spec.name);
  }, [stagesWithItsApplicationsWatch.isSuccess, stagesWithItsApplicationsWatch.data]);

  const appCodebasesOptions = React.useMemo(() => {
    if (!stagesWithItsApplicationsWatch.isSuccess || !stagesWithItsApplicationsWatch.data) {
      return [];
    }

    return (
      stagesWithItsApplicationsWatch.data.stagesWithItsApplications?.[0]?.applications.map(
        (app) => app.appCodebase.metadata.name
      ) || []
    );
  }, [stagesWithItsApplicationsWatch.isSuccess, stagesWithItsApplicationsWatch.data]);

  const healthOptions: SelectOption[] = React.useMemo(
    () => [
      { label: "All", value: "All" },
      ...Object.values(applicationHealthStatus).map((s) => ({ label: capitalizeFirstLetter(s), value: s })),
    ],
    []
  );

  const { viewMode, handleChangeViewMode } = useViewModeContext();

  return (
    <div className="flex gap-4 items-center justify-end">
      <div className="flex-1">
        <div className="grid grid-cols-12 gap-4 items-center">
          <div className="col-span-3">
            <form.Field name={stagesFilterControlNames.APPLICATION}>
              {(field) => (
                <FormAutocomplete
                  field={field}
                  multiple
                  options={appCodebasesOptions}
                  label="Applications"
                  placeholder="Applications"
                  getOptionLabel={(option) => option as string}
                  ChipProps={{ size: "small", color: "primary" }}
                />
              )}
            </form.Field>
          </div>
          <div className="col-span-3">
            <form.Field name={stagesFilterControlNames.STAGES}>
              {(field) => (
                <FormAutocomplete
                  field={field}
                  multiple
                  options={stageSelectOptions}
                  label="Stages"
                  placeholder="Stages"
                  getOptionLabel={(option) => option as string}
                  ChipProps={{ size: "small", color: "primary" }}
                />
              )}
            </form.Field>
          </div>
          <div className="col-span-2">
            <form.Field name={stagesFilterControlNames.HEALTH}>
              {(field) => <FormSelect field={field} label="Health" options={healthOptions} placeholder="Health" />}
            </form.Field>
          </div>
        </div>
      </div>
      <div>
        <div className="flex flex-row gap-0 justify-end">
          <Tooltip title={"View Less Details"}>
            <IconButton onClick={() => handleChangeViewMode(VIEW_MODES.COMPACT)} size="large">
              <Rows2
                color={viewMode === VIEW_MODES.COMPACT ? theme.palette.primary.main : theme.palette.action.active}
                size={16}
              />
            </IconButton>
          </Tooltip>
          <Tooltip title={"View More Details"}>
            <IconButton onClick={() => handleChangeViewMode(VIEW_MODES.DETAILED)} size="large">
              <Rows3
                color={viewMode === VIEW_MODES.DETAILED ? theme.palette.primary.main : theme.palette.action.active}
                size={16}
              />
            </IconButton>
          </Tooltip>
        </div>
      </div>
      <div>
        <ButtonWithPermission
          ButtonProps={{
            startIcon: <Plus />,
            color: "primary",
            variant: "contained",
            onClick: () => {
              openManageStageDialog({
                cdPipeline: cdPipelineWatch.query.data!,
                otherStages: stagesWithItsApplicationsWatch.data?.stages || [],
              });
            },
          }}
          allowed={stagePermissions.data.create.allowed}
          reason={stagePermissions.data.create.reason}
        >
          create environment
        </ButtonWithPermission>
      </div>
    </div>
  );
};
