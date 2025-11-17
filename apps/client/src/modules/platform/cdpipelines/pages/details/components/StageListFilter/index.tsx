import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { Autocomplete as FormAutocomplete } from "@/core/components/form/Autocomplete";
import { Select as FormSelect, SelectOption } from "@/core/components/form/Select";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { useViewModeContext } from "@/core/providers/ViewMode/hooks";
import { VIEW_MODES } from "@/core/providers/ViewMode/types";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { useStagePermissions } from "@/k8s/api/groups/KRCI/Stage";
import { ManageStageDialog } from "@/modules/platform/cdpipelines/dialogs/ManageStage";
import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import { applicationHealthStatus } from "@my-project/shared";
import { Plus, Rows2, Rows3 } from "lucide-react";
import React from "react";
import { useCDPipelineWatch, useStagesWithItsApplicationsWatch } from "../../hooks/data";
import { useStageFilter } from "./hooks/useStageFilter";
import { stagesFilterControlNames } from "./constants";

export const StageListFilter = () => {
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
    <div className="flex items-center justify-end gap-4">
      <div className="flex-1">
        <div className="grid grid-cols-12 items-center gap-4">
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
        <div className="flex flex-row justify-end gap-0">
          <Tooltip title={"View Less Details"}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleChangeViewMode(VIEW_MODES.COMPACT)}
              className={viewMode === VIEW_MODES.COMPACT ? "text-primary" : "text-muted-foreground"}
            >
              <Rows2 className={viewMode === VIEW_MODES.COMPACT ? "text-primary" : "text-muted-foreground"} size={16} />
            </Button>
          </Tooltip>
          <Tooltip title={"View More Details"}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleChangeViewMode(VIEW_MODES.DETAILED)}
              className={viewMode === VIEW_MODES.DETAILED ? "text-primary" : "text-muted-foreground"}
            >
              <Rows3
                className={viewMode === VIEW_MODES.DETAILED ? "text-primary" : "text-muted-foreground"}
                size={16}
              />
            </Button>
          </Tooltip>
        </div>
      </div>
      <div>
        <ButtonWithPermission
          ButtonProps={{
            variant: "default",
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
          <Plus />
          Create Environment
        </ButtonWithPermission>
      </div>
    </div>
  );
};
