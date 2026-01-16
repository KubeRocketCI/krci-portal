import React from "react";
import { useForm } from "react-hook-form";
import { MultiFormItem } from "@/core/providers/MultiForm/types";
import { FORM_MODES } from "@/core/types/forms";
import { useQuickLinkCRUD, useQuickLinkPermissions } from "@/k8s/api/groups/KRCI/QuickLink";
import { editQuickLinkURL, QuickLink } from "@my-project/shared";

interface UseQuickLinkEditFormParams {
  quickLink: QuickLink | undefined;
  formFieldName: string;
}

/**
 * Shared hook for QuickLink edit form across multiple configuration modules.
 *
 * Note: Type assertions are necessary due to react-hook-form's limitations with
 * dynamically-named fields. The generic type T is provided by the consumer to
 * ensure type safety at the call site.
 */
export function useQuickLinkEditForm<T extends Record<string, string | undefined>>({
  quickLink,
  formFieldName,
}: UseQuickLinkEditFormParams): MultiFormItem<T> {
  const {
    triggerPatchQuickLink,
    mutations: { quickLinkPatchMutation },
  } = useQuickLinkCRUD();

  const quickLinkPermissions = useQuickLinkPermissions();

  // Type assertion needed: dynamic field name prevents TypeScript from inferring correct type
  const defaultValues = React.useMemo(
    () =>
      ({
        [formFieldName]: quickLink?.spec.url,
      }) as T,
    [quickLink?.spec.url, formFieldName]
  );

  const form = useForm<T>({
    defaultValues: defaultValues as any,
  });

  React.useEffect(() => {
    form.reset(defaultValues as any, { keepDirty: false });
  }, [defaultValues, form]);

  const handleSubmit = React.useCallback(
    async (values: T) => {
      if (!quickLinkPermissions.data.patch.allowed || !quickLink) {
        return;
      }

      const editedQuickLink = editQuickLinkURL(quickLink, {
        url: values[formFieldName] as string,
      });

      await triggerPatchQuickLink({
        data: {
          quickLink: editedQuickLink,
        },
      });
    },
    [quickLinkPermissions.data.patch.allowed, quickLink, triggerPatchQuickLink, formFieldName]
  );

  // Type assertion needed: react-hook-form's UseFormReturn generic doesn't align with MultiFormItem expectations
  return React.useMemo(
    () =>
      ({
        mode: FORM_MODES.EDIT,
        form,
        onSubmit: form.handleSubmit(handleSubmit as any),
        isSubmitting: quickLinkPatchMutation.isPending,
        allowedToSubmit: {
          isAllowed: quickLinkPermissions.data.patch.allowed,
          reason: quickLinkPermissions.data.patch.reason,
        },
      }) as unknown as MultiFormItem<T>,
    [
      form,
      handleSubmit,
      quickLinkPatchMutation.isPending,
      quickLinkPermissions.data.patch.allowed,
      quickLinkPermissions.data.patch.reason,
    ]
  );
}
