import { ActionsInlineList } from "@/core/components/ActionsInlineList";
import { ActionsMenuList } from "@/core/components/ActionsMenuList";
import { DeleteKubeObjectDialog } from "@/core/components/DeleteKubeObject";
import { DIALOG_NAME_DELETE_KUBE_OBJECT } from "@/core/components/DeleteKubeObject/constants";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { createResourceAction } from "@/core/utils/createResourceAction";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { useCodebasePermissions } from "@/k8s/api/groups/KRCI/Codebase";
import { actionMenuType } from "@/k8s/constants/actionMenuTypes";
import { useClusterStore } from "@/k8s/store";
import { Button } from "@mui/material";
import type { CDPipeline, Codebase } from "@my-project/shared";
import { k8sCodebaseConfig, k8sOperation } from "@my-project/shared";
import { Link } from "@tanstack/react-router";
import { AlertCircle, Pencil, Trash } from "lucide-react";
import React from "react";
import { useShallow } from "zustand/react/shallow";
import { ManageCodebaseDialog } from "../../dialogs/ManageCodebase";
import { useCodebaseDeletionConflictResourceQuery } from "./hooks/useDeletionConflictItem";
import { CodebaseActionsMenuProps } from "./types";
import { PATH_CDPIPELINE_DETAILS_FULL } from "@/modules/platform/cdpipelines/pages/details/route";

interface DeletionErrorMessageProps {
  codebase: Codebase;
  conflictedPipeline: CDPipeline;
  clusterName: string;
}

const DeletionErrorMessage = ({ codebase, conflictedPipeline, clusterName }: DeletionErrorMessageProps) => {
  const { closeDialog } = useDialogContext();

  return (
    <div
      className="flex flex-col gap-8 p-10 rounded-md bg-red-50/30 border border-red-400/30"
    >
      <div className="flex items-center gap-6">
        <AlertCircle size={20} style={{ color: "#d32f2f", flexShrink: 0 }} />
        <p className="text-sm font-semibold text-[#d32f2f] text-[0.9375rem]">
          Cannot Delete Codebase
        </p>
      </div>

      <div className="flex flex-col gap-2 pl-18">
        <p className="text-sm text-foreground leading-relaxed">
          {capitalizeFirstLetter(codebase.spec.type)}{" "}
          <span className="font-semibold text-foreground">
            {codebase.metadata.name}
          </span>{" "}
          is currently being used in the following Deployment Flow:
        </p>

        <div
          className="mt-4 p-6 rounded bg-background border border-border"
        >
          {/* @ts-expect-error TODO: Fix when migrating to tailwind */}
          <Button
            component={Link}
            variant="text"
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
          </Button>
        </div>

        <p className="text-sm mt-4 text-muted-foreground">
          Please remove this codebase from the Deployment Flow before deleting it.
        </p>
      </div>
    </div>
  );
};

export const CodebaseActionsMenu = ({
  backRoute,
  variant,
  data: { codebase },
  anchorEl,
  handleCloseResourceActionListMenu,
}: CodebaseActionsMenuProps) => {
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

  const actions = React.useMemo(() => {
    if (!codebase) {
      return [];
    }

    return [
      createResourceAction({
        type: k8sOperation.patch,
        label: capitalizeFirstLetter(k8sOperation.patch),
        item: codebase,
        Icon: <Pencil size={16} />,
        disabled: {
          status: !codebasePermissions.data.patch.allowed,
          reason: codebasePermissions.data.patch.reason,
        },
        callback: (codebase) => {
          if (variant === actionMenuType.menu && handleCloseResourceActionListMenu) {
            handleCloseResourceActionListMenu();
          }

          setDialog(ManageCodebaseDialog, { codebase });
        },
      }),
      createResourceAction({
        type: k8sOperation.delete,
        label: capitalizeFirstLetter(k8sOperation.delete),
        item: codebase,
        Icon: <Trash size={16} />,
        disabled: {
          status: !codebasePermissions.data.delete.allowed,
          reason: codebasePermissions.data.delete.reason,
        },
        callback: (codebase) => {
          if (variant === actionMenuType.menu && handleCloseResourceActionListMenu) {
            handleCloseResourceActionListMenu();
          }

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
    codebasePermissions.data.delete.allowed,
    codebasePermissions.data.delete.reason,
    codebasePermissions.data.patch.allowed,
    codebasePermissions.data.patch.reason,
    handleCloseResourceActionListMenu,
    onBeforeSubmit,
    setDialog,
    variant,
  ]);

  return variant === actionMenuType.inline ? (
    <ActionsInlineList actions={actions} />
  ) : variant === actionMenuType.menu ? (
    <ActionsMenuList
      actions={actions}
      anchorEl={anchorEl!}
      handleCloseActionsMenu={handleCloseResourceActionListMenu!}
    />
  ) : null;
};
