import React from "react";
import { DialogBody, DialogFooter, DialogHeader } from "@/core/components/ui/dialog";
import { DialogHeader as CustomDialogHeader } from "./components/DialogHeader";
import { Form } from "./components/Form";
import { FormActions } from "./components/FormActions";
import { useDefaultValues } from "./hooks/useDefaultValues";
import { QuickLinkFormProvider } from "../../providers/form/provider";
import { FormGuidePanel } from "@/core/components/FormGuide";
import { useCurrentDialog } from "../../providers/CurrentDialog/hooks";
import { useQuickLinkCRUD } from "@/k8s/api/groups/KRCI/QuickLink";
import { editQuickLink } from "@my-project/shared";
import type { ManageQuickLinkFormValues } from "../../types";

export const Edit = () => {
  const baseDefaultValues = useDefaultValues();

  const {
    props: { quickLink },
    state: { closeDialog },
  } = useCurrentDialog();

  const { triggerPatchQuickLink } = useQuickLinkCRUD();

  const handleSubmit = React.useCallback(
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
          onSuccess: closeDialog,
        },
      });
    },
    [closeDialog, quickLink, triggerPatchQuickLink]
  );

  return (
    <QuickLinkFormProvider defaultValues={baseDefaultValues as ManageQuickLinkFormValues} onSubmit={handleSubmit}>
      <DialogHeader>
        <CustomDialogHeader />
      </DialogHeader>
      <DialogBody className="flex min-h-0 !overflow-hidden">
        <div className="flex h-full flex-1 gap-4">
          <div className="flex-1 overflow-y-auto">
            <Form />
          </div>
          <FormGuidePanel />
        </div>
      </DialogBody>
      <DialogFooter>
        <FormActions />
      </DialogFooter>
    </QuickLinkFormProvider>
  );
};
