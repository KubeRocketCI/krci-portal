import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { useStagePermissions } from "@/core/k8s/api/groups/KRCI/Stage";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { Filter } from "@/core/providers/Filter/components/Filter";
import { useViewModeContext } from "@/core/providers/ViewMode/hooks";
import { VIEW_MODES } from "@/core/providers/ViewMode/types";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { ManageStageDialog } from "@/modules/platform/cdpipelines/dialogs/ManageStage";
import { Autocomplete } from "@mui/lab";
import {
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Tooltip,
  useTheme,
} from "@mui/material";
import { ApplicationHealthStatus, applicationHealthStatus } from "@my-project/shared";
import { Plus, Rows2, Rows3 } from "lucide-react";
import React from "react";
import { stagesFilterControlNames } from "../../constants";
import { useCDPipelineWatch, useStagesWithItsApplicationsWatch } from "../../hooks/data";
import { usePageFilterContext } from "../../hooks/usePageFilterContext";

export const StageListFilter = () => {
  const theme = useTheme();
  const cdPipelineWatch = useCDPipelineWatch();
  const stagesWithItsApplicationsWatch = useStagesWithItsApplicationsWatch();

  const stagePermissions = useStagePermissions();

  const openManageStageDialog = useDialogOpener(ManageStageDialog);

  const { filter, setFilterItem } = usePageFilterContext();

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

  const handleStagesChange = React.useCallback(
    (_event: React.SyntheticEvent<Element, Event>, values: string[]) => {
      setFilterItem(stagesFilterControlNames.STAGES, values);
    },
    [setFilterItem]
  );

  const handleApplicationChange = React.useCallback(
    (_event: React.SyntheticEvent<Element, Event>, values: string[]) => {
      setFilterItem(stagesFilterControlNames.APPLICATION, values);
    },
    [setFilterItem]
  );

  const handleHealthChange = React.useCallback(
    (event: SelectChangeEvent<ApplicationHealthStatus>) => {
      const value = event.target.value;

      setFilterItem(stagesFilterControlNames.HEALTH, value);
    },
    [setFilterItem]
  );

  const healthOptions = ["All", ...Object.values(applicationHealthStatus)].map((status) => ({
    label: capitalizeFirstLetter(status),
    value: status,
  }));

  const { viewMode, handleChangeViewMode } = useViewModeContext();

  return (
    <Grid container spacing={2} alignItems={"center"} justifyContent={"flex-end"}>
      <Grid item flexGrow={1}>
        <Filter
          controls={{
            [stagesFilterControlNames.APPLICATION]: {
              gridXs: 3,
              component: (
                <Autocomplete
                  multiple
                  options={appCodebasesOptions}
                  getOptionLabel={(option) => option}
                  onChange={handleApplicationChange}
                  value={(filter.values.application as string[]) || []}
                  renderInput={(params) => <TextField {...params} label="Applications" />}
                  ChipProps={{
                    size: "small",
                    color: "primary",
                  }}
                />
              ),
            },
            [stagesFilterControlNames.STAGES]: {
              gridXs: 3,
              component: (
                <Autocomplete
                  multiple
                  options={stageSelectOptions}
                  getOptionLabel={(option) => option}
                  onChange={handleStagesChange}
                  value={(filter.values.stages as string[]) || []}
                  renderInput={(params) => <TextField {...params} label="Stages" placeholder="Stages" />}
                  ChipProps={{
                    size: "small",
                    color: "primary",
                  }}
                />
              ),
            },
            [stagesFilterControlNames.HEALTH]: {
              gridXs: 2,
              component: (
                <FormControl fullWidth>
                  <InputLabel>Health</InputLabel>
                  <Select
                    fullWidth
                    value={(filter.values.health || "") as ApplicationHealthStatus}
                    displayEmpty
                    onChange={handleHealthChange}
                    sx={{
                      color: filter.values.health ? theme.palette.text.secondary : theme.palette.text.disabled,
                    }}
                  >
                    <MenuItem value="" disabled>
                      Health
                    </MenuItem>
                    {healthOptions.map(({ label, value }, idx) => {
                      const key = `${label}::${idx}`;

                      return (
                        <MenuItem value={value} key={key}>
                          {label}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              ),
            },
          }}
        />
      </Grid>
      <Grid item>
        <Stack direction="row" spacing={0} justifyContent={"flex-end"}>
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
        </Stack>
      </Grid>
      <Grid item>
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
      </Grid>
    </Grid>
  );
};
