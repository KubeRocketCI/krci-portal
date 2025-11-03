import { Button } from "@mui/material";
import React from "react";
import { useTypedFormContext } from "../../../../hooks/useFormContext";
import { useCurrentDialog } from "../../../../providers/CurrentDialog/hooks";
import { ManageQuickLinkFormValues } from "../../../../types";
import { useQuickLinkCRUD } from "@/k8s/api/groups/KRCI/QuickLink";
import { editQuickLink } from "@my-project/shared";

export const FormActions = () => {
  const {
    props: { quickLink },
    state: { closeDialog },
  } = useCurrentDialog();

  const {
    reset,
    formState: { isDirty },
    handleSubmit,
  } = useTypedFormContext();

  const handleClose = React.useCallback(() => {
    closeDialog();
    reset();
  }, [closeDialog, reset]);

  const handleResetFields = React.useCallback(() => {
    reset();
  }, [reset]);

  const {
    triggerPatchQuickLink,
    mutations: { quickLinkPatchMutation },
  } = useQuickLinkCRUD();

  const isLoading = quickLinkPatchMutation.isPending;

  const onSubmit = React.useCallback(
    async (values: ManageQuickLinkFormValues) => {
      if (!quickLink) {
        return;
      }

      const editedQuickLink = editQuickLink(quickLink, {
        visible: values.visible,
        url: values.url,
        icon: values.icon,
      });

      await triggerPatchQuickLink({
        data: {
          quickLink: editedQuickLink,
        },
        callbacks: {
          onSuccess: handleClose,
        },
      });
    },
    [handleClose, quickLink, triggerPatchQuickLink]
  );

  return (
    <div className="flex w-full justify-between gap-2">
      <div className="flex gap-1">
        <div className="text-foreground">
          <Button onClick={handleClose} size="small" color="inherit">
            cancel
          </Button>
        </div>
        <Button onClick={handleResetFields} size="small" disabled={!isDirty}>
          undo changes
        </Button>
      </div>
      <Button
        onClick={handleSubmit(onSubmit)}
        variant={"contained"}
        color={"primary"}
        size="small"
        disabled={!isDirty || isLoading}
      >
        apply
      </Button>
    </div>
  );
};
