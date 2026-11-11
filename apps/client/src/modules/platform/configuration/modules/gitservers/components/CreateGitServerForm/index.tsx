import React from "react";
import { GitServerForm } from "./components/GitServer";
import { CredentialsForm } from "./components/Credentials";
import { FormActions } from "./components/FormActions";
import { CreateGitServerFormProvider } from "./providers/form/provider";
import { CreateGitServerFormValues, NAMES } from "./names";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { createGitServerSecretName, gitProvider } from "@my-project/shared";
import { useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";
import { getUsedGitProviders } from "@/modules/platform/configuration/modules/gitservers/utils/getUsedGitProviders";
import { getDefaultGitProvider } from "./utils/getDefaultGitProvider";
import { getDefaultGitUser } from "./utils/getDefaultGitUser";
import { showToast } from "@/core/components/Snackbar";
import { Separator } from "@/core/components/ui/separator";

export type { CreateGitServerFormProps } from "./types";

export const CreateGitServerForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const trpc = useTRPCClient();
  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

  const gitServersWatch = useGitServerWatchList();

  // Stays undefined while the list loads, when it fails, or when every provider already has a Git Server.
  const defaultGitProvider = React.useMemo(() => {
    if (gitServersWatch.isLoading || gitServersWatch.error) {
      return undefined;
    }

    return getDefaultGitProvider(getUsedGitProviders(gitServersWatch.data.array));
  }, [gitServersWatch.data.array, gitServersWatch.isLoading, gitServersWatch.error]);

  const defaultValues = React.useMemo<Partial<CreateGitServerFormValues>>(
    () => ({
      [NAMES.GIT_PROVIDER]: defaultGitProvider,
      [NAMES.GIT_USER]: defaultGitProvider ? getDefaultGitUser(defaultGitProvider) : undefined,
      [NAMES.SKIP_WEBHOOK_SSL]: false,
      [NAMES.TEKTON_DISABLED]: false,
      [NAMES.OVERRIDE_WEBHOOK_URL]: false,
      [NAMES.SSH_PORT]: 22,
      [NAMES.HTTPS_PORT]: 443,
    }),
    [defaultGitProvider]
  );

  const handleSubmit = React.useCallback(
    async (values: CreateGitServerFormValues) => {
      if (gitServersWatch.isLoading || gitServersWatch.error) {
        showToast("Existing Git Servers could not be checked.", "error", {
          duration: 10000,
          description: gitServersWatch.error?.message,
        });
        return;
      }

      if (getUsedGitProviders(gitServersWatch.data.array).has(values[NAMES.GIT_PROVIDER])) {
        showToast("A Git Server for this provider already exists.", "error", { duration: 10000 });
        return;
      }

      const loadingToastId = showToast("Creating Git Server integration", "loading");
      try {
        const result = await trpc.k8s.manageGitServerIntegration.mutate({
          clusterName,
          namespace: defaultNamespace,
          mode: "create",
          dirtyFields: { gitServer: true, secret: true },
          gitServer: {
            name: values[NAMES.GIT_PROVIDER],
            gitHost: values[NAMES.GIT_HOST],
            gitProvider: values[NAMES.GIT_PROVIDER],
            gitUser: values[NAMES.GIT_USER],
            nameSshKeySecret: createGitServerSecretName(values[NAMES.GIT_PROVIDER], values[NAMES.GIT_PROVIDER]),
            sshPort: values[NAMES.SSH_PORT],
            httpsPort: values[NAMES.HTTPS_PORT],
            skipWebhookSSLVerification: values[NAMES.SKIP_WEBHOOK_SSL],
            tektonDisabled: values[NAMES.TEKTON_DISABLED],
            webhookUrl: values[NAMES.OVERRIDE_WEBHOOK_URL] ? (values[NAMES.WEBHOOK_URL] ?? "") : undefined,
            currentResource: undefined,
          },
          secret:
            values[NAMES.GIT_PROVIDER] === gitProvider.gerrit
              ? {
                  gitProvider: gitProvider.gerrit,
                  sshPrivateKey: values[NAMES.SSH_PRIVATE_KEY],
                  sshPublicKey: (values[NAMES.SSH_PUBLIC_KEY] ?? "").trim(),
                  currentResource: undefined,
                }
              : {
                  gitProvider: values[NAMES.GIT_PROVIDER] as "bitbucket" | "github" | "gitlab",
                  sshPrivateKey: values[NAMES.SSH_PRIVATE_KEY],
                  token: (values[NAMES.TOKEN] ?? "").trim(),
                  currentResource: undefined,
                },
        });

        if (!result.success) {
          throw new Error("Failed to create Git Server integration");
        }

        showToast(result.data?.message ?? "Git Server integration created successfully", "success", {
          id: loadingToastId,
          duration: 5000,
        });
        onClose();
      } catch (error) {
        console.error("Git Server integration save failed:", error);
        showToast("Failed to create Git Server integration", "error", {
          id: loadingToastId,
          duration: 10000,
          description: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    [
      clusterName,
      defaultNamespace,
      trpc,
      onClose,
      gitServersWatch.data.array,
      gitServersWatch.isLoading,
      gitServersWatch.error,
    ]
  );

  const handleSubmitError = React.useCallback((error: unknown) => {
    console.error("Form submission error:", error);
  }, []);

  return (
    <CreateGitServerFormProvider
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      onSubmitError={handleSubmitError}
    >
      <div className="flex flex-col gap-4">
        <GitServerForm />
        <Separator />
        <CredentialsForm />
        <FormActions onClose={onClose} />
      </div>
    </CreateGitServerFormProvider>
  );
};
