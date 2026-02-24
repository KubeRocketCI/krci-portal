import { ScrollText, Terminal } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { PodLogsDialog } from "@/modules/platform/cdpipelines/dialogs/PodLogs";
import { PodExecDialog } from "@/modules/platform/cdpipelines/dialogs/PodExec";
import { useStageWatch } from "@/modules/platform/cdpipelines/pages/stage-details/hooks";
import { Application, Codebase } from "@my-project/shared";

interface PodsColumnProps {
  appCodebase: Codebase;
  application: Application | undefined;
}

export const PodsColumn = ({ appCodebase, application }: PodsColumnProps) => {
  const stageWatch = useStageWatch();
  const openPodLogsDialog = useDialogOpener(PodLogsDialog);
  const openPodExecDialog = useDialogOpener(PodExecDialog);

  const appName = appCodebase?.metadata.name;
  const namespace = stageWatch.query.data?.spec.namespace;

  const disabled = (() => {
    if (!application) {
      return {
        status: true,
        reason: "Could not find ArgoCD Application for this application",
      };
    }

    return {
      status: false,
    };
  })();

  return (
    <div className="flex flex-row items-center justify-center gap-2">
      <Tooltip title={disabled.status ? disabled.reason : "Show Logs"}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            openPodLogsDialog({
              namespace: namespace!,
              appName: appName,
            })
          }
          disabled={disabled.status}
          className="h-9 w-9"
        >
          <ScrollText className="h-5 w-5" />
        </Button>
      </Tooltip>
      <Tooltip title={disabled.status ? disabled.reason : "Show Terminal"}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            openPodExecDialog({
              namespace: namespace!,
              appName: appName,
            })
          }
          disabled={disabled.status}
          className="h-9 w-9"
        >
          <Terminal className="h-5 w-5" />
        </Button>
      </Tooltip>
    </div>
  );
};
