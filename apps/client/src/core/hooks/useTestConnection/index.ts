import React from "react";
import { useTRPCClient } from "@/core/providers/trpc";
import type { TestConnectionStatus } from "@/core/components/TestConnectionBlock";

interface ErrorLabels {
  unauthorized: string;
  httpError: (statusCode: number | undefined) => string;
}

type IntegrationServiceType = "argocd" | "sonar" | "nexus" | "jira" | "defectdojo" | "dependencyTrack";

interface UseTestConnectionOptions {
  serviceType: IntegrationServiceType;
  serviceName: string;
  getCredentials: () => { url: string; token: string };
  formValuesKey: string;
  errorLabels?: Partial<ErrorLabels>;
}

const DEFAULT_ERROR_LABELS: ErrorLabels = {
  unauthorized: "Authentication failed. Check your credentials.",
  httpError: (statusCode) => `Service responded with status ${statusCode}.`,
};

export function useTestConnection({
  serviceType,
  serviceName,
  getCredentials,
  formValuesKey,
  errorLabels,
}: UseTestConnectionOptions) {
  const trpc = useTRPCClient();

  const [testStatus, setTestStatus] = React.useState<TestConnectionStatus>("idle");
  const [testError, setTestError] = React.useState<string | null>(null);

  // Reset test status when form values change
  React.useEffect(() => {
    setTestStatus("idle");
    setTestError(null);
  }, [formValuesKey]);

  const handleTestConnection = React.useCallback(async () => {
    const labels: ErrorLabels = { ...DEFAULT_ERROR_LABELS, ...errorLabels };
    const { url, token } = getCredentials();
    setTestStatus("loading");
    setTestError(null);

    try {
      const result = await trpc.k8s.testIntegrationConnection.mutate({
        serviceType,
        url,
        token,
      });

      if (result.success) {
        setTestStatus("success");
      } else {
        setTestStatus("error");
        switch (result.error) {
          case "UNAUTHORIZED":
            setTestError(labels.unauthorized);
            break;
          case "TIMEOUT":
            setTestError("Connection timed out after 10 seconds.");
            break;
          case "NETWORK":
            setTestError(result.message);
            break;
          case "HTTP_ERROR":
            setTestError(labels.httpError(result.statusCode));
            break;
        }
      }
    } catch (error) {
      setTestStatus("error");
      setTestError(error instanceof Error ? error.message : "An unexpected error occurred.");
    }
  }, [getCredentials, serviceType, trpc, errorLabels]);

  return {
    testStatus,
    testError,
    handleTestConnection,
    serviceName,
  };
}
