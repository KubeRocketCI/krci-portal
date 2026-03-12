import { Button } from "@/core/components/ui/button";
import React from "react";
import { useDataContext } from "../../providers/Data/hooks";
import { FORM_MODES } from "@/core/types/forms";
import { useManageSonarForm } from "../../providers/form/hooks";
import { useStore } from "@tanstack/react-form";
import { TestConnectionBlock } from "@/core/components/TestConnectionBlock";
import { useTestConnection } from "@/core/hooks/useTestConnection";

export const Actions = () => {
  const form = useManageSonarForm();
  const { secret, handleClosePanel } = useDataContext();

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
    serviceType: "sonar",
    serviceName: "SonarQube",
    getCredentials,
    formValuesKey,
    errorLabels: {
      unauthorized: "Authentication failed. Check your token.",
      httpError: (statusCode) => `SonarQube responded with status ${statusCode}.`,
    },
  });

  const mode = secret ? FORM_MODES.EDIT : FORM_MODES.CREATE;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  };

  return (
    <div className="flex flex-col gap-4">
      <TestConnectionBlock
        status={testStatus}
        error={testError}
        onTest={handleTestConnection}
        disabled={!isDirty}
        serviceName={serviceName}
      />
      <div className="flex flex-row items-center justify-between gap-4">
        {mode === FORM_MODES.CREATE && (
          <Button onClick={handleClosePanel} variant="ghost" size="sm">
            Cancel
          </Button>
        )}
        <div className="ml-auto flex flex-row items-center gap-4">
          <Button onClick={() => form.reset()} size="sm" variant="ghost" disabled={!isDirty}>
            Undo Changes
          </Button>
          <Button onClick={handleSubmit} size="sm" variant="default" disabled={!isDirty || isSubmitting}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};
