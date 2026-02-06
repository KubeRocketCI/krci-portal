import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import React from "react";
import { useDataContext } from "../../providers/Data/hooks";
import { FORM_MODES } from "@/core/types/forms";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";
import { Plug, Loader2, CheckCircle2 } from "lucide-react";
import { useManageDefectDojoForm } from "../../providers/form/hooks";
import { useStore } from "@tanstack/react-form";
import { useTRPCClient } from "@/core/providers/trpc";
import { Alert, AlertRoot, AlertDescription } from "@/core/components/ui/alert";

type TestConnectionStatus = "idle" | "loading" | "success" | "error";

export const Actions = () => {
  const form = useManageDefectDojoForm();
  const { secret, handleClosePanel } = useDataContext();
  const trpc = useTRPCClient();

  const isDirty = useStore(form.store, (state) => state.isDirty);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const formValuesKey = useStore(
    form.store,
    (state) => `${state.values.url}|${state.values.token}|${state.values.externalUrl}`
  );

  const [testStatus, setTestStatus] = React.useState<TestConnectionStatus>("idle");
  const [testError, setTestError] = React.useState<string | null>(null);

  // Reset test status when form values change
  React.useEffect(() => {
    setTestStatus("idle");
    setTestError(null);
  }, [formValuesKey]);

  const handleTestConnection = async () => {
    const { url, token } = form.store.state.values;
    setTestStatus("loading");
    setTestError(null);

    let cancelled = false;

    try {
      const result = await trpc.k8s.testIntegrationConnection.mutate({ serviceType: "defectdojo", url, token });
      if (cancelled) return;

      if (result.success) {
        setTestStatus("success");
      } else {
        setTestStatus("error");
        switch (result.error) {
          case "UNAUTHORIZED":
            setTestError("Authentication failed. Check your token.");
            break;
          case "TIMEOUT":
            setTestError("Connection timed out after 10 seconds.");
            break;
          case "NETWORK":
            setTestError(result.message);
            break;
          case "HTTP_ERROR":
            setTestError(`DefectDojo responded with status ${result.statusCode}.`);
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
    <div className="flex flex-col gap-2">
      {(testStatus === "success" || testStatus === "error") && (
        <div className="my-2">
          {testStatus === "success" && (
            <AlertRoot className="border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200">
              <CheckCircle2 />
              <AlertDescription>Connection to DefectDojo is working.</AlertDescription>
            </AlertRoot>
          )}
          {testStatus === "error" && <Alert variant="destructive">{testError}</Alert>}
        </div>
      )}
      <div className="flex flex-row items-center justify-between gap-4">
        {mode === FORM_MODES.CREATE && (
          <Button onClick={handleClosePanel} variant="ghost" size="sm">
            Cancel
          </Button>
        )}

        <ConditionalWrapper
          condition={!isDirty}
          wrapper={(children) => (
            <Tooltip title="Edit credentials to test the connection">
              <div>{children}</div>
            </Tooltip>
          )}
        >
          <Button
            onClick={handleTestConnection}
            size="sm"
            variant="outline"
            disabled={!isDirty || testStatus === "loading"}
          >
            {testStatus === "loading" ? (
              <>
                <Loader2 className="animate-spin" /> Testing...
              </>
            ) : (
              <>
                <Plug /> Test Connection
              </>
            )}
          </Button>
        </ConditionalWrapper>
        <div className="flex flex-row items-center gap-4">
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
