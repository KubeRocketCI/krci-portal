import { Button } from "@/core/components/ui/button";
import React from "react";
import { useTypedFormContext } from "../../../../hooks/useFormContext";
import { useCurrentDialog } from "../../../../providers/CurrentDialog/hooks";
import { useQuickLinkCRUD } from "@/k8s/api/groups/KRCI/QuickLink";
import { ManageQuickLinkFormValues } from "../../../../types";
import { createQuickLinkDraft } from "@my-project/shared";

export const FormActions = () => {
  const {
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
    triggerCreateQuickLink,
    mutations: { quickLinkCreateMutation },
  } = useQuickLinkCRUD();

  const isLoading = quickLinkCreateMutation.isPending;

  const onSubmit = React.useCallback(
    async (values: ManageQuickLinkFormValues) => {
      const newQuickLink = createQuickLinkDraft({
        name: values.name,
        icon: values.icon,
        url: values.url,
        visible: values.visible,
      });

      await triggerCreateQuickLink({
        data: {
          quickLink: newQuickLink,
        },
        callbacks: {
          onSuccess: handleClose,
        },
      });
    },
    [triggerCreateQuickLink, handleClose]
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
        Create
      </Button>
    </div>
  );
};
