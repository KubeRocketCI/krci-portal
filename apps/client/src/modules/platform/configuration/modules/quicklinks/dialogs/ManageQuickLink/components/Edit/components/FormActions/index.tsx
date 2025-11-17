import { Button } from "@/core/components/ui/button";
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
        <Button onClick={handleClose} variant="ghost" size="sm">
          Cancel
        </Button>
        <Button onClick={handleResetFields} variant="ghost" size="sm" disabled={!isDirty}>
          Undo Changes
        </Button>
      </div>
      <Button onClick={handleSubmit(onSubmit)} variant={"default"} size="sm" disabled={!isDirty || isLoading}>
        Apply
      </Button>
    </div>
  );
};
