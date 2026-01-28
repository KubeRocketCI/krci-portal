import { ActionsInlineList } from "@/core/components/ActionsInlineList";
import { ActionsMenuList } from "@/core/components/ActionsMenuList";
import { DeleteKubeObjectDialog } from "@/core/components/DeleteKubeObject";
import { DIALOG_NAME_DELETE_KUBE_OBJECT } from "@/core/components/DeleteKubeObject/constants";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { createResourceAction, getResourceProtection, getDisabledState } from "@/core/utils/createResourceAction";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { useCodebasePermissions } from "@/k8s/api/groups/KRCI/Codebase";
import { actionMenuType } from "@/k8s/constants/actionMenuTypes";
import { useClusterStore } from "@/k8s/store";
import { Button } from "@/core/components/ui/button";
import type { CDPipeline, Codebase } from "@my-project/shared";
import { k8sCodebaseConfig, k8sOperation } from "@my-project/shared";
import { Link } from "@tanstack/react-router";
import { AlertCircle, Settings, Trash } from "lucide-react";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { useCodebaseDeletionConflictResourceQuery } from "./hooks/useDeletionConflictItem";
import { CodebaseActionsMenuProps } from "./types";
import { PATH_CDPIPELINE_DETAILS_FULL } from "@/modules/platform/cdpipelines/pages/details/route";
import { EditCodebaseDialog } from "@/modules/platform/codebases/components/EditCodebaseDialog";

interface DeletionErrorMessageProps {
  codebase: Codebase;
  conflictedPipeline: CDPipeline;
  clusterName: string;
}

const DeletionErrorMessage = ({ codebase, conflictedPipeline, clusterName }: DeletionErrorMessageProps) => {
  const { closeDialog } = useDialogContext();

  return (
    <div className="flex flex-col gap-8 rounded-md border border-red-400/30 bg-red-50/30 p-10">
      <div className="flex items-center gap-6">
        <AlertCircle size={20} className="text-destructive shrink-0" />
        <p className="text-destructive text-sm text-[0.9375rem] font-semibold">Cannot Delete Codebase</p>
      </div>

      <div className="flex flex-col gap-2 pl-18">
        <p className="text-foreground text-sm leading-relaxed">
          {capitalizeFirstLetter(codebase.spec.type)}{" "}
          <span className="text-foreground font-semibold">{codebase.metadata.name}</span> is currently being used in the
          following Deployment Flow:
        </p>

        <div className="bg-background border-border mt-4 rounded border p-6">
          <Button variant="ghost" asChild className="h-auto p-0 font-semibold">
            <Link
              to={PATH_CDPIPELINE_DETAILS_FULL}
              params={{
                clusterName,
                name: conflictedPipeline.metadata.name,
                namespace: conflictedPipeline.metadata.namespace!,
              }}
              onClick={() => {
                closeDialog(DIALOG_NAME_DELETE_KUBE_OBJECT);
              }}
            >
              {conflictedPipeline.metadata.name}
            </Link>
          </Button>
        </div>

        <p className="text-muted-foreground mt-4 text-sm">
          Please remove this codebase from the Deployment Flow before deleting it.
        </p>
      </div>
    </div>
  );
};

export const CodebaseActionsMenu = ({ backRoute, variant, data: { codebase } }: CodebaseActionsMenuProps) => {
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));

  const codebasePermissions = useCodebasePermissions();

  const { setDialog } = useDialogContext();

  const conflictedCDPipelineQuery = useCodebaseDeletionConflictResourceQuery(codebase);

  const ErrorMessage = React.useMemo(() => {
    if (!conflictedCDPipelineQuery?.data || !codebase) {
      return null;
    }

    return (
      <DeletionErrorMessage
        codebase={codebase}
        conflictedPipeline={conflictedCDPipelineQuery.data}
        clusterName={clusterName}
      />
    );
  }, [clusterName, codebase, conflictedCDPipelineQuery]);

  const onBeforeSubmit = React.useCallback(
    async (setErrorTemplate: (error: React.ReactNode) => void, setLoadingActive: (loading: boolean) => void) => {
      setLoadingActive(true);
      if (!conflictedCDPipelineQuery || !conflictedCDPipelineQuery?.data) {
        setLoadingActive(false);
        return;
      }

      setErrorTemplate(ErrorMessage);
      setLoadingActive(false);
    },
    [conflictedCDPipelineQuery, ErrorMessage]
  );

  // Check if the codebase is protected from updates (allows viewing but not saving)
  const patchProtection = getResourceProtection(codebase, k8sOperation.patch);
  const deleteProtection = getResourceProtection(codebase, k8sOperation.delete);

  const actions = React.useMemo(() => {
    if (!codebase) {
      return [];
    }

    return [
      createResourceAction({
        type: k8sOperation.patch,
        label: "Configure",
        item: codebase,
        Icon: <Settings size={16} />,
        disabled: {
          status: !codebasePermissions.data.patch.allowed,
          reason: codebasePermissions.data.patch.reason,
        },
        callback: (codebase) => {
          setDialog(EditCodebaseDialog, { codebase, isProtected: patchProtection.isProtected });
        },
      }),
      createResourceAction({
        type: k8sOperation.delete,
        label: capitalizeFirstLetter(k8sOperation.delete),
        item: codebase,
        Icon: <Trash size={16} />,
        disabled: getDisabledState(deleteProtection, codebasePermissions.data.delete),
        callback: (codebase) => {
          setDialog(DeleteKubeObjectDialog, {
            objectName: codebase?.metadata?.name,
            resource: codebase,
            resourceConfig: k8sCodebaseConfig,
            description: "Confirm the deletion of the codebase with all its components",
            onBeforeSubmit,
            backRoute,
          });
        },
      }),
    ];
  }, [
    backRoute,
    codebase,
    codebasePermissions.data.delete,
    codebasePermissions.data.patch.allowed,
    codebasePermissions.data.patch.reason,
    deleteProtection,
    patchProtection.isProtected,
    onBeforeSubmit,
    setDialog,
  ]);

  return variant === actionMenuType.inline ? (
    <ActionsInlineList actions={actions} />
  ) : variant === actionMenuType.menu ? (
    <ActionsMenuList actions={actions} />
  ) : null;
};
