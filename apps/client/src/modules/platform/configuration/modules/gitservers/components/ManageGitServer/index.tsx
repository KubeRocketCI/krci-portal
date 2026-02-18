import React from "react";
import { Actions } from "./components/Actions";
import { CredentialsForm } from "./components/Credentials";
import { GitServerForm } from "./components/GitServer";
import { DataContextProvider } from "./providers/Data";
import { ManageGitServerFormProvider } from "./providers/form/provider";
import { ManageGitServerFormValues, NAMES } from "./names";
import { ManageGitServerProps } from "./types";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { useSecretWatchItem } from "@/k8s/api/groups/Core/Secret";
import { createGitServerSecretName, safeDecode } from "@my-project/shared";
import { toast } from "sonner";
import { gitProvider } from "@my-project/shared";

export const ManageGitServer = ({ gitServer, webhookURL, handleClosePanel }: ManageGitServerProps) => {
  const trpc = useTRPCClient();
  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

  const secretName = createGitServerSecretName(gitServer?.spec?.gitProvider ?? "github");
  const gitServerSecretWatch = useSecretWatchItem({ name: secretName });
  const gitServerSecret = gitServerSecretWatch.query.data;

  const defaultValues = React.useMemo<Partial<ManageGitServerFormValues>>(() => {
    const base: Partial<ManageGitServerFormValues> = {
      [NAMES.GIT_PROVIDER]: "github",
      [NAMES.SKIP_WEBHOOK_SSL]: false,
      [NAMES.TEKTON_DISABLED]: false,
      [NAMES.OVERRIDE_WEBHOOK_URL]: false,
      [NAMES.SSH_PORT]: 22,
      [NAMES.HTTPS_PORT]: 443,
      [NAMES.NAME_SSH_KEY_SECRET]: createGitServerSecretName("github"),
    };
    if (gitServer) {
      base[NAMES.NAME] = gitServer.metadata.name;
      base[NAMES.GIT_HOST] = gitServer.spec?.gitHost ?? "";
      base[NAMES.GIT_PROVIDER] = gitServer.spec?.gitProvider ?? "github";
      base[NAMES.GIT_USER] = gitServer.spec?.gitUser ?? "";
      base[NAMES.NAME_SSH_KEY_SECRET] = gitServer.spec?.nameSshKeySecret ?? "";
      base[NAMES.SSH_PORT] = Number(gitServer.spec?.sshPort) || 22;
      base[NAMES.HTTPS_PORT] = Number(gitServer.spec?.httpsPort) || 443;
      base[NAMES.SKIP_WEBHOOK_SSL] = gitServer.spec?.skipWebhookSSLVerification ?? false;
      base[NAMES.TEKTON_DISABLED] = gitServer.spec?.tektonDisabled ?? false;
      base[NAMES.OVERRIDE_WEBHOOK_URL] = !!gitServer.spec?.webhookUrl;
      base[NAMES.WEBHOOK_URL] = gitServer.spec?.webhookUrl || webhookURL || "";
    }
    if (gitServerSecret) {
      base[NAMES.SSH_PRIVATE_KEY] = safeDecode(gitServerSecret.data?.["id_rsa"] ?? "", "");
      base[NAMES.SSH_PUBLIC_KEY] = safeDecode(gitServerSecret.data?.["id_rsa.pub"] ?? "", "");
      base[NAMES.TOKEN] = safeDecode(gitServerSecret.data?.token ?? "", "");
    }
    return base;
  }, [gitServer, gitServerSecret, webhookURL]);

  const handleSubmit = React.useCallback(
    async (values: ManageGitServerFormValues) => {
      const mode = gitServer ? "edit" : "create";
      const gitProviderValue = values[NAMES.GIT_PROVIDER];
      const secretPayload =
        gitProviderValue === gitProvider.gerrit
          ? {
              gitProvider: gitProviderValue as "gerrit",
              sshPrivateKey: values[NAMES.SSH_PRIVATE_KEY],
              sshPublicKey: (values[NAMES.SSH_PUBLIC_KEY] ?? "").trim(),
              currentResource: mode === "edit" ? gitServerSecret : undefined,
            }
          : {
              gitProvider: gitProviderValue as "bitbucket" | "github" | "gitlab",
              sshPrivateKey: values[NAMES.SSH_PRIVATE_KEY],
              token: (values[NAMES.TOKEN] ?? "").trim(),
              currentResource: mode === "edit" ? gitServerSecret : undefined,
            };

      const initialGitServer = gitServer
        ? {
            name: gitServer.metadata.name,
            gitHost: gitServer.spec?.gitHost ?? "",
            gitProvider: gitServer.spec?.gitProvider,
            gitUser: gitServer.spec?.gitUser ?? "",
            nameSshKeySecret: gitServer.spec?.nameSshKeySecret ?? "",
            sshPort: Number(gitServer.spec?.sshPort),
            httpsPort: Number(gitServer.spec?.httpsPort),
            skipWebhookSSLVerification: gitServer.spec?.skipWebhookSSLVerification ?? false,
            tektonDisabled: gitServer.spec?.tektonDisabled ?? false,
            webhookUrl: gitServer.spec?.webhookUrl,
          }
        : null;

      const gitServerDirty =
        !initialGitServer ||
        initialGitServer.name !== values[NAMES.NAME] ||
        initialGitServer.gitHost !== values[NAMES.GIT_HOST] ||
        initialGitServer.gitProvider !== values[NAMES.GIT_PROVIDER] ||
        initialGitServer.gitUser !== values[NAMES.GIT_USER] ||
        initialGitServer.nameSshKeySecret !== values[NAMES.NAME_SSH_KEY_SECRET] ||
        initialGitServer.sshPort !== values[NAMES.SSH_PORT] ||
        initialGitServer.httpsPort !== values[NAMES.HTTPS_PORT] ||
        initialGitServer.skipWebhookSSLVerification !== values[NAMES.SKIP_WEBHOOK_SSL] ||
        initialGitServer.tektonDisabled !== values[NAMES.TEKTON_DISABLED] ||
        (values[NAMES.OVERRIDE_WEBHOOK_URL]
          ? (initialGitServer.webhookUrl ?? "") !== (values[NAMES.WEBHOOK_URL] ?? "")
          : !!initialGitServer.webhookUrl);

      const initialSecret = gitServerSecret;
      const secretDirty =
        !initialSecret ||
        safeDecode(initialSecret.data?.["id_rsa"] ?? "", "") !== values[NAMES.SSH_PRIVATE_KEY] ||
        (gitProviderValue === gitProvider.gerrit
          ? safeDecode(initialSecret.data?.["id_rsa.pub"] ?? "", "") !== (values[NAMES.SSH_PUBLIC_KEY] ?? "")
          : safeDecode(initialSecret.data?.token ?? "", "") !== (values[NAMES.TOKEN] ?? ""));

      try {
        const result = await trpc.k8s.manageGitServerIntegration.mutate({
          clusterName,
          namespace: defaultNamespace,
          mode,
          dirtyFields: { gitServer: gitServerDirty, secret: secretDirty },
          gitServer: {
            name: values[NAMES.NAME],
            gitHost: values[NAMES.GIT_HOST],
            gitProvider: values[NAMES.GIT_PROVIDER],
            gitUser: values[NAMES.GIT_USER],
            nameSshKeySecret: values[NAMES.NAME_SSH_KEY_SECRET],
            sshPort: values[NAMES.SSH_PORT],
            httpsPort: values[NAMES.HTTPS_PORT],
            skipWebhookSSLVerification: values[NAMES.SKIP_WEBHOOK_SSL],
            tektonDisabled: values[NAMES.TEKTON_DISABLED],
            webhookUrl: values[NAMES.OVERRIDE_WEBHOOK_URL] ? (values[NAMES.WEBHOOK_URL] ?? "") : undefined,
            currentResource: gitServer,
          },
          secret: secretPayload,
        });

        if (!result.success) {
          throw new Error("Failed to save Git Server integration");
        }

        toast.success(result.data?.message ?? "Git Server integration saved successfully");
        handleClosePanel?.();
      } catch (error) {
        console.error("Git Server integration save failed:", error);
        toast.error(error instanceof Error ? error.message : "Failed to save Git Server integration");
        throw error;
      }
    },
    [clusterName, defaultNamespace, gitServer, gitServerSecret, trpc, handleClosePanel]
  );

  const handleSubmitError = React.useCallback((error: unknown) => {
    console.error("Form submission error:", error);
  }, []);

  return (
    <div data-testid="form">
      <DataContextProvider gitServer={gitServer} gitServerSecret={gitServerSecret} handleClosePanel={handleClosePanel}>
        <ManageGitServerFormProvider
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          onSubmitError={handleSubmitError}
        >
          <div className="flex flex-col gap-6">
            <div>
              <GitServerForm />
            </div>
            <div>
              <CredentialsForm />
            </div>
            <div>
              <Actions />
            </div>
          </div>
        </ManageGitServerFormProvider>
      </DataContextProvider>
    </div>
  );
};
