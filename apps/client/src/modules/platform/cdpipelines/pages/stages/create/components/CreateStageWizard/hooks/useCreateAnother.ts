import React from "react";
import { useCreateStageForm } from "../providers/form/hooks";
import { useWizardStore } from "../store";

/**
 * Returns a callback that starts the wizard over at its first step.
 * The form resets to the `defaultValues` of the provider's latest render.
 */
export function useCreateAnother(): () => void {
  const form = useCreateStageForm();

  return React.useCallback(() => {
    form.reset();
    useWizardStore.getState().reset();
  }, [form]);
}
