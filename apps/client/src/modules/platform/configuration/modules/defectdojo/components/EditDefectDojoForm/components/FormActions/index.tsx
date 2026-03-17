import { Button } from "@/core/components/ui/button";
import React from "react";
import { useEditDefectDojoForm } from "../../providers/form/hooks";
import { useStore } from "@tanstack/react-form";
import { TestConnectionBlock } from "@/core/components/TestConnectionBlock";
import { useTestConnection } from "@/core/hooks/useTestConnection";

export const FormActions: React.FC = () => {
  const form = useEditDefectDojoForm();

  const isDirty = useStore(form.store, (state) => state.isDirty);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const formValuesKey = useStore(
    form.store,
    (state) => `${state.values.url}|${state.values.token}|${state.values.externalUrl}`
  );

  const getCredentials = React.useCallback(
    () => ({ url: form.store.state.values.url, token: form.store.state.values.token }),
    [form.store]
  );

  const { testStatus, testError, handleTestConnection, serviceName } = useTestConnection({
    serviceType: "defectdojo",
    serviceName: "DefectDojo",
    getCredentials,
    formValuesKey,
    errorLabels: {
      unauthorized: "Authentication failed. Check your token.",
      httpError: (statusCode) => `DefectDojo responded with status ${statusCode}.`,
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
      <div className="flex justify-end gap-2">
        <Button onClick={() => form.reset()} size="sm" variant="ghost" disabled={!isDirty}>
          Undo Changes
        </Button>
        <Button onClick={handleSubmit} size="sm" variant="default" disabled={!isDirty || isSubmitting}>
          Save
        </Button>
      </div>
    </div>
  );
};
