import { Button } from "@/core/components/ui/button";
import React from "react";
import { useEditArgoCDForm } from "../../providers/form/hooks";
import { useStore } from "@tanstack/react-form";
import { TestConnectionBlock } from "@/core/components/TestConnectionBlock";
import { useTestConnection } from "@/core/hooks/useTestConnection";

export interface FormActionsProps {
  onClose: () => void;
}

export const FormActions: React.FC<FormActionsProps> = ({ onClose }) => {
  const form = useEditArgoCDForm();

  const isDirty = useStore(form.store, (state) => state.isDirty);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const canSubmit = useStore(form.store, (state) => state.canSubmit);
  const formValuesKey = useStore(
    form.store,
    (state) => `${state.values.url}|${state.values.token}|${state.values.externalUrl}`
  );

  const getCredentials = React.useCallback(
    () => ({ url: form.store.state.values.url, token: form.store.state.values.token }),
    [form.store]
  );

  const { testStatus, testError, handleTestConnection, serviceName } = useTestConnection({
    serviceType: "argocd",
    serviceName: "Argo CD",
    getCredentials,
    formValuesKey,
    errorLabels: {
      unauthorized: "Authentication failed. Check your token.",
      httpError: (statusCode) => `Argo CD responded with status ${statusCode}.`,
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <TestConnectionBlock
        status={testStatus}
        error={testError}
        onTest={handleTestConnection}
        disabled={!isDirty}
        serviceName={serviceName}
      />
      <div className="flex justify-between gap-2">
        <div className="flex gap-2">
          <Button onClick={onClose} size="sm" variant="ghost">
            Cancel
          </Button>
          <Button onClick={() => form.reset()} size="sm" variant="ghost" disabled={!isDirty}>
            Undo Changes
          </Button>
        </div>
        <Button onClick={handleSubmit} size="sm" variant="default" disabled={!isDirty || isSubmitting || !canSubmit}>
          Save
        </Button>
      </div>
    </div>
  );
};
