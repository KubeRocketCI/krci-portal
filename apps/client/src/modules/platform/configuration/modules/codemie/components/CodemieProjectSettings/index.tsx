import EditorYAML from "@/core/components/EditorYAML";
import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { StatusIcon } from "@/core/components/StatusIcon";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import {
  useCodemieProjectSettingsCRUD,
  useCodemieProjectSettingsWatchList,
} from "@/k8s/api/groups/KRCI/CodemieProjectSettings";
import { getCodemieProjectSettingsStatusIcon } from "@/k8s/api/groups/KRCI/CodemieProjectSettings/utils/getStatusIcon";
import { Button, Grid, Paper, Stack, Typography, useTheme } from "@mui/material";
import { Pencil } from "lucide-react";
import { CodemieProjectSettings } from "@my-project/shared";

export const CodemieProjectSettingsSection = () => {
  const theme = useTheme();
  const codemieProjectSettingsWatch = useCodemieProjectSettingsWatchList();
  const codemieProjectSettings = codemieProjectSettingsWatch.data.array;

  const openEditorDialog = useDialogOpener(EditorYAML);

  const { triggerEditCodemieProjectSettings } = useCodemieProjectSettingsCRUD();

  return (
    <>
      <Typography
        fontSize={theme.typography.pxToRem(24)}
        color="primary.dark"
        sx={{ mb: (t) => t.typography.pxToRem(24) }}
      >
        Project Settings
      </Typography>
      <LoadingWrapper isLoading={!codemieProjectSettingsWatch.isReady}>
        {codemieProjectSettingsWatch.query.error ? (
          <ErrorContent error={codemieProjectSettingsWatch.query.error} outlined />
        ) : codemieProjectSettings?.length ? (
          <Grid container spacing={2}>
            {codemieProjectSettings.map((setting) => {
              const status = setting?.status?.value;
              const statusError = setting?.status?.error;

              const statusIcon = getCodemieProjectSettingsStatusIcon(setting);

              return (
                <Grid item xs={12} key={setting.metadata.name}>
                  <Paper sx={{ p: (t) => `${t.typography.pxToRem(10)} ${t.typography.pxToRem(20)}` }}>
                    <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                      <Stack direction="row" spacing={2} alignItems="center">
                        <StatusIcon
                          Icon={statusIcon.component}
                          color={statusIcon.color}
                          Title={
                            <>
                              <Typography variant={"subtitle2"} style={{ fontWeight: 600 }}>
                                {`Status: ${status || "Unknown"}`}
                              </Typography>
                              {!!statusError && (
                                <Typography variant={"subtitle2"} sx={{ mt: theme.typography.pxToRem(10) }}>
                                  {statusError}
                                </Typography>
                              )}
                            </>
                          }
                        />
                        <Typography variant={"h6"}>{setting.metadata.name}</Typography>
                      </Stack>
                      <Button
                        startIcon={<Pencil size={16} />}
                        size="small"
                        component={"button"}
                        style={{ flexShrink: 0 }}
                        color="inherit"
                        onClick={() => {
                          openEditorDialog({
                            content: setting,
                            onSave: (_yaml, json) => {
                              if (!json) {
                                return;
                              }

                              triggerEditCodemieProjectSettings({
                                data: {
                                  resource: json as CodemieProjectSettings,
                                },
                              });
                            },
                          });
                        }}
                      >
                        Edit YAML
                      </Button>
                    </Stack>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <EmptyList customText={"No CodeMie Project Settings Found."} />
        )}
      </LoadingWrapper>
    </>
  );
};
