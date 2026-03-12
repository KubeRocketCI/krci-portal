import { Button } from "@/core/components/ui/button";
import React from "react";
import { useDataContext } from "../../providers/Data/hooks";
import { FORM_MODES } from "@/core/types/forms";
import { useManageJiraServerForm } from "../../providers/form/hooks";
import { useStore } from "@tanstack/react-form";
import { useTRPCClient } from "@/core/providers/trpc";
import { TestConnectionBlock, type TestConnectionStatus } from "@/core/components/TestConnectionBlock";

export const Actions = () => {
  const form = useManageJiraServerForm();
  const { secret, handleClosePanel } = useDataContext();
  const trpc = useTRPCClient();

  const isDirty = useStore(form.store, (state) => state.isDirty);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const formValuesKey = useStore(
    form.store,
    (state) => `${state.values.url}|${state.values.username}|${state.values.password}`
  );

  const [testStatus, setTestStatus] = React.useState<TestConnectionStatus>("idle");
  const [testError, setTestError] = React.useState<string | null>(null);

  // Reset test status when form values change
  React.useEffect(() => {
    setTestStatus("idle");
    setTestError(null);
  }, [formValuesKey]);

  const handleTestConnection = async () => {
    const { url, username, password } = form.store.state.values;
    setTestStatus("loading");
    setTestError(null);

    let cancelled = false;

    try {
      const token = btoa(`${username}:${password}`);
      const result = await trpc.k8s.testIntegrationConnection.mutate({ serviceType: "jira", url, token });
      if (cancelled) return;

      if (result.success) {
        setTestStatus("success");
      } else {
        setTestStatus("error");
        switch (result.error) {
          case "UNAUTHORIZED":
            setTestError("Authentication failed. Check your username and password.");
            break;
          case "TIMEOUT":
            setTestError("Connection timed out after 10 seconds.");
            break;
          case "NETWORK":
            setTestError(result.message);
            break;
          case "HTTP_ERROR":
            setTestError(`Jira responded with status ${result.statusCode}.`);
            break;
        }
      }
    } catch (error) {
      if (cancelled) return;
      setTestStatus("error");
      setTestError(error instanceof Error ? error.message : "An unexpected error occurred.");
    }

    return () => {
      cancelled = true;
    };
  };

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
        serviceName="Jira"
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
