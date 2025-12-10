import React from "react";
import { Dialog, DialogContent, DialogBody, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { PodExecTerminal } from "@/core/components/PodExecTerminal";
import { usePodWatchList } from "@/k8s/api/groups/Core/Pod";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { PodExecDialogProps } from "./types";
import { DIALOG_NAME } from "./constants";

export const PodExecDialog: React.FC<PodExecDialogProps> = ({ props, state }) => {
  const { namespace, appName } = props;
  const { open, closeDialog } = state;

  const clusterName = useClusterStore(useShallow((state) => state.clusterName));

  const podWatchList = usePodWatchList({
    namespace,
    labels: {
      "app.kubernetes.io/instance": appName,
    },
  });

  const pods = podWatchList.data.array;
  const isLoading = podWatchList.query.isLoading;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="h-[80vh] w-full max-w-6xl">
        <DialogHeader>
          <DialogTitle>Terminal - {appName}</DialogTitle>
        </DialogHeader>
        <DialogBody className="flex flex-col overflow-hidden p-0">
          <LoadingWrapper isLoading={isLoading}>
            {pods.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <span className="text-muted-foreground">No pods found for this application</span>
              </div>
            ) : (
              <PodExecTerminal clusterName={clusterName} namespace={namespace} pods={pods} height={600} />
            )}
          </LoadingWrapper>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

PodExecDialog.displayName = DIALOG_NAME;
