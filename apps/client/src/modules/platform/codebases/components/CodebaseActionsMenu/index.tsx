import { actionMenuType } from "@/core/k8s/constants/actionMenuTypes";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { createResourceAction } from "@/core/utils/createResourceAction";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { Typography } from "@mui/material";
import { k8sCodebaseConfig, k8sOperation } from "@my-project/shared";
import { Pencil, Trash } from "lucide-react";
import React from "react";
import { ManageCodebaseDialog } from "../../dialogs/ManageCodebase";
import { useStyles } from "./styles";
import { CodebaseActionsMenuProps } from "./types";
import { useCodebasePermissions } from "@/core/k8s/api/groups/KRCI/Codebase";
import { ActionsInlineList } from "@/core/components/ActionsInlineList";
import { ActionsMenuList } from "@/core/components/ActionsMenuList";
import { DeleteKubeObjectDialog } from "@/core/components/DeleteKubeObject";
import { useDeletionConflictItem } from "./hooks/useDeletionConflictItem";
import { Link } from "@tanstack/react-router";
import { routeCDPipelineDetails } from "@/modules/platform/cdpipelines/pages/details/route";
import { useClusterStore } from "@/core/store";
import { useShallow } from "zustand/react/shallow";

export const CodebaseActionsMenu = ({
  backRoute,
  variant,
  data: { codebase },
  anchorEl,
  handleCloseResourceActionListMenu,
}: CodebaseActionsMenuProps) => {
  const classes = useStyles();

  const clusterName = useClusterStore(useShallow((state) => state.clusterName));

  const codebasePermissions = useCodebasePermissions();

  const { setDialog } = useDialogContext();

  const conflictedCDPipeline = useDeletionConflictItem(codebase);

  const ErrorMessage = React.useMemo(() => {
    if (!conflictedCDPipeline || !codebase) {
      return null;
    }

    return (
      <div className={classes.message}>
        <Typography component={"span"}>
          {capitalizeFirstLetter(codebase.spec.type)} {codebase.metadata.name} is used in
        </Typography>
        <div className={classes.conflictEntityName}>
          <Link
            to={routeCDPipelineDetails.fullPath}
            params={{
              clusterName,
              name: conflictedCDPipeline.metadata.name,
              namespace: conflictedCDPipeline.metadata.namespace!,
            }}
          >
            {conflictedCDPipeline.metadata.name}
          </Link>
        </div>
        <Typography component={"span"}> Deployment Flow</Typography>
      </div>
    );
  }, [classes.conflictEntityName, classes.message, clusterName, codebase, conflictedCDPipeline]);

  const onBeforeSubmit = React.useCallback(
    async (setErrorTemplate: (error: React.ReactNode) => void, setLoadingActive: (loading: boolean) => void) => {
      setLoadingActive(true);
      if (!conflictedCDPipeline) {
        setLoadingActive(false);
        return;
      }

      setErrorTemplate(ErrorMessage);
      setLoadingActive(false);
    },
    [conflictedCDPipeline, ErrorMessage]
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
