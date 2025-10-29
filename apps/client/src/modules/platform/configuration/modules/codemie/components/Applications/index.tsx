import EditorYAML from "@/core/components/EditorYAML";
import { EmptyList } from "@/core/components/EmptyList";
import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { StatusIcon } from "@/core/components/StatusIcon";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { useCodemieApplicationCRUD, useCodemieApplicationWatchList } from "@/k8s/api/groups/KRCI/CodemieApplication";
import { getCodemieApplicationStatusIcon } from "@/k8s/api/groups/KRCI/CodemieApplication/utils/getStatusIcon";
import { Button, Paper } from "@mui/material";
import { CodemieApplication } from "@my-project/shared";
import { Pencil } from "lucide-react";

export const CodemieApplications = () => {
  const codemieApplicationsWatch = useCodemieApplicationWatchList();
  const codemieApplications = codemieApplicationsWatch.data.array;

  const openEditorDialog = useDialogOpener(EditorYAML);

  const { triggerEditCodemieApplication } = useCodemieApplicationCRUD();

  return (
    <>
      <h2 className="text-2xl font-semibold text-foreground mb-6">
        Applications
      </h2>
      <LoadingWrapper isLoading={!codemieApplicationsWatch.isReady}>
        {codemieApplicationsWatch.query.error ? (
          <ErrorContent error={codemieApplicationsWatch.query.error} outlined />
        ) : codemieApplications?.length ? (
          <div className="flex flex-col gap-4">
            {codemieApplications?.map((application) => {
              const status = application?.status?.value;
              const statusError = application?.status?.error;

              const statusIcon = getCodemieApplicationStatusIcon(application);

              return (
                <div key={application.metadata.name}>
                  <Paper sx={{ p: (t) => `${t.typography.pxToRem(10)} ${t.typography.pxToRem(20)}` }}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <StatusIcon
                          Icon={statusIcon.component}
                          color={statusIcon.color}
                          Title={
                            <>
                              <p className="text-sm font-semibold">
                                {`Status: ${status || "Unknown"}`}
                              </p>
                              {!!statusError && (
                                <p className="text-sm font-medium mt-3">
                                  {statusError}
                                </p>
                              )}
                            </>
                          }
                        />
                        <h6 className="text-base font-medium">{application.metadata.name}</h6>
                      </div>
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
                    </div>
                  </Paper>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyList customText={"No CodeMie Applications Found."} />
        )}
      </LoadingWrapper>
    </>
  );
};
