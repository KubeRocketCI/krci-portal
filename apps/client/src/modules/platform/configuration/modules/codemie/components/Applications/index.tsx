import EditorYAML from "@/core/components/EditorYAML";
import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { StatusIcon } from "@/core/components/StatusIcon";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { useCodemieApplicationCRUD, useCodemieApplicationWatchList } from "@/k8s/api/groups/KRCI/CodemieApplication";
import { getCodemieApplicationStatusIcon } from "@/k8s/api/groups/KRCI/CodemieApplication/utils/getStatusIcon";
import { Button, Grid, Paper, Stack, Typography, useTheme } from "@mui/material";
import { CodemieApplication } from "@my-project/shared";
import { Pencil } from "lucide-react";

export const CodemieApplications = () => {
  const theme = useTheme();
  const codemieApplicationsWatch = useCodemieApplicationWatchList();
  const codemieApplications = codemieApplicationsWatch.dataArray;

  const openEditorDialog = useDialogOpener(EditorYAML);

  const { triggerEditCodemieApplication } = useCodemieApplicationCRUD();

  return (
    <>
      <Typography
        fontSize={theme.typography.pxToRem(24)}
        color="primary.dark"
        sx={{ mb: (t) => t.typography.pxToRem(24) }}
      >
        Applications
      </Typography>
      <LoadingWrapper isLoading={!codemieApplicationsWatch.isReady}>
        {codemieApplicationsWatch.query.error ? (
          <ErrorContent error={codemieApplicationsWatch.query.error} outlined />
        ) : codemieApplications?.length ? (
          <Grid container spacing={2}>
            {codemieApplications?.map((application) => {
              const status = application?.status?.value;
              const statusError = application?.status?.error;

              const statusIcon = getCodemieApplicationStatusIcon(application);

              return (
                <Grid item xs={12} key={application.metadata.name}>
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
                        <Typography variant={"h6"}>{application.metadata.name}</Typography>
                      </Stack>
                      <Button
                        startIcon={<Pencil size={16} />}
                        size="small"
                        component={"button"}
                        style={{ flexShrink: 0 }}
                        color="inherit"
                        onClick={() => {
                          openEditorDialog({
                            content: application,
                            onSave: (_yaml, json) => {
                              if (!json) {
                                return;
                              }

                              triggerEditCodemieApplication({
                                data: {
                                  resource: json as CodemieApplication,
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
          <EmptyList customText={"No CodeMie Applications Found."} />
        )}
      </LoadingWrapper>
    </>
  );
};
