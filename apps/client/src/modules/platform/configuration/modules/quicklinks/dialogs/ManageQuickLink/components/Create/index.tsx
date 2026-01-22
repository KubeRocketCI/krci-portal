import React from "react";
import { DialogBody, DialogFooter, DialogHeader } from "@/core/components/ui/dialog";
import { DialogHeader as CustomDialogHeader } from "./components/DialogHeader";
import { Form } from "./components/Form";
import { FormActions } from "./components/FormActions";
import { QuickLinkFormProvider } from "../../providers/form/provider";
import { createDefaultValues } from "../../providers/form/constants";
import { useCurrentDialog } from "../../providers/CurrentDialog/hooks";
import { useQuickLinkCRUD } from "@/k8s/api/groups/KRCI/QuickLink";
import { createQuickLinkDraft } from "@my-project/shared";
import type { ManageQuickLinkFormValues } from "../../types";

export const Create = () => {
  const {
    state: { closeDialog },
  } = useCurrentDialog();

  const { triggerCreateQuickLink } = useQuickLinkCRUD();

  const handleSubmit = React.useCallback(
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
          onSuccess: closeDialog,
        },
      });
    },
    [triggerCreateQuickLink, closeDialog]
  );

  return (
    <QuickLinkFormProvider defaultValues={createDefaultValues} onSubmit={handleSubmit}>
      <DialogHeader>
        <CustomDialogHeader />
      </DialogHeader>
      <DialogBody>
        <Form />
      </DialogBody>
      <DialogFooter>
        <FormActions />
      </DialogFooter>
    </QuickLinkFormProvider>
  );
};
