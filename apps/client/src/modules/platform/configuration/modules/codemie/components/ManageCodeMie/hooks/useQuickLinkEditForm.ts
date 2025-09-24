import React from "react";
import { useForm } from "react-hook-form";
import { QUICK_LINK_FORM_NAMES } from "../names";
import { QuickLinkFormValues } from "../types";
import { editQuickLinkURL, QuickLink } from "@my-project/shared";
import { useQuickLinkCRUD, useQuickLinkPermissions } from "@/k8s/api/groups/KRCI/QuickLink";
import { MultiFormItem } from "@/core/providers/MultiForm/types";
import { FORM_MODES } from "@/core/types/forms";

export const useQuickLinkEditForm = ({
  quickLink,
}: {
  quickLink: QuickLink | undefined;
}): MultiFormItem<QuickLinkFormValues> => {
  const {
    triggerPatchQuickLink,
    mutations: { quickLinkPatchMutation },
  } = useQuickLinkCRUD();

  const quickLinkPermissions = useQuickLinkPermissions();

  const defaultValues = React.useMemo(
    () => ({
      [QUICK_LINK_FORM_NAMES.EXTERNAL_URL]: quickLink?.spec.url,
    }),
    [quickLink?.spec.url]
  );

  const form = useForm<QuickLinkFormValues>({
    defaultValues: defaultValues,
  });

  React.useEffect(() => {
    form.reset(defaultValues, { keepDirty: false });
  }, [defaultValues, form]);

  const handleSubmit = React.useCallback(
    async (values: QuickLinkFormValues) => {
      if (!quickLinkPermissions.data.patch.allowed || !quickLink) {
        return;
      }

      const newQuickLinkData = editQuickLinkURL(quickLink, {
        url: values.externalUrl,
      });

      await triggerPatchQuickLink({
        data: {
          quickLink: newQuickLinkData,
        },
      });
    },
    [quickLinkPermissions.data.patch.allowed, quickLink, triggerPatchQuickLink]
  );

  return React.useMemo(
    () => ({
      mode: FORM_MODES.EDIT,
      form,
      onSubmit: form.handleSubmit(handleSubmit),
      isSubmitting: quickLinkPatchMutation.isPending,
      allowedToSubmit: {
        isAllowed: quickLinkPermissions.data.patch.allowed,
        reason: quickLinkPermissions.data.patch.reason,
      },
    }),
    [
      form,
      handleSubmit,
      quickLinkPatchMutation.isPending,
      quickLinkPermissions.data.patch.allowed,
      quickLinkPermissions.data.patch.reason,
    ]
  );
};
