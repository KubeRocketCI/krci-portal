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
import { Button } from "@/core/components/ui/button";
import { Pencil } from "lucide-react";
import { CodemieProjectSettings } from "@my-project/shared";

export const CodemieProjectSettingsSection = () => {
  const codemieProjectSettingsWatch = useCodemieProjectSettingsWatchList();
  const codemieProjectSettings = codemieProjectSettingsWatch.data.array;

  const openEditorDialog = useDialogOpener(EditorYAML);

  const { triggerEditCodemieProjectSettings } = useCodemieProjectSettingsCRUD();

  return (
    <>
      <h2 className="text-foreground mb-6 text-2xl font-semibold">Project Settings</h2>
      <LoadingWrapper isLoading={!codemieProjectSettingsWatch.isReady}>
        {codemieProjectSettingsWatch.query.error ? (
          <ErrorContent error={codemieProjectSettingsWatch.query.error} outlined />
        ) : codemieProjectSettings?.length ? (
          <div className="flex flex-col gap-4">
            {codemieProjectSettings.map((setting) => {
              const status = setting?.status?.value;
              const statusError = setting?.status?.error;

              const statusIcon = getCodemieProjectSettingsStatusIcon(setting);

              return (
                <div key={setting.metadata.name}>
                  <div className="bg-card rounded px-5 py-2.5 shadow">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <StatusIcon
                          Icon={statusIcon.component}
                          color={statusIcon.color}
                          Title={
                            <>
                              <p className="text-sm font-semibold">{`Status: ${status || "Unknown"}`}</p>
                              {!!statusError && <p className="mt-3 text-sm font-medium">{statusError}</p>}
                            </>
                          }
                        />
                        <h6 className="text-base font-medium">{setting.metadata.name}</h6>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
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
                        <Pencil size={16} />
                        Edit YAML
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyList customText={"No CodeMie Project Settings Found."} />
        )}
      </LoadingWrapper>
    </>
  );
};
