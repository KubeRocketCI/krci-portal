import React from "react";
import { DialogBody, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { FormGuideToggleButton, FormGuidePanel } from "@/core/components/FormGuide";
import { GitServerForm } from "./components/GitServer";
import { CredentialsForm } from "./components/Credentials";
import { FormActions } from "./components/FormActions";
import { EditGitServerFormProvider } from "./providers/form/provider";
import { EditGitServerFormValues, NAMES } from "./names";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { useSecretWatchItem } from "@/k8s/api/groups/Core/Secret";
import { createGitServerSecretName, safeDecode } from "@my-project/shared";
import { toast } from "sonner";
import { gitProvider } from "@my-project/shared";
import { Separator } from "@/core/components/ui/separator";
import type { GitServer } from "@my-project/shared";

export type { EditGitServerFormProps } from "./types";

export const EditGitServerForm: React.FC<{
  gitServer: GitServer;
  webhookURL: string | undefined;
  onClose?: () => void;
}> = ({ gitServer, webhookURL, onClose }) => {
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

  const ownerReference = gitServerSecret?.metadata?.ownerReferences?.[0]?.kind;

  const defaultValues = React.useMemo<Partial<EditGitServerFormValues>>(() => {
    const base: Partial<EditGitServerFormValues> = {
      [NAMES.NAME]: gitServer.metadata.name,
      [NAMES.GIT_HOST]: gitServer.spec?.gitHost ?? "",
      [NAMES.GIT_PROVIDER]: gitServer.spec?.gitProvider ?? "github",
      [NAMES.GIT_USER]: gitServer.spec?.gitUser ?? "",
      [NAMES.NAME_SSH_KEY_SECRET]: gitServer.spec?.nameSshKeySecret ?? "",
      [NAMES.SSH_PORT]: Number(gitServer.spec?.sshPort) || 22,
      [NAMES.HTTPS_PORT]: Number(gitServer.spec?.httpsPort) || 443,
      [NAMES.SKIP_WEBHOOK_SSL]: gitServer.spec?.skipWebhookSSLVerification ?? false,
      [NAMES.TEKTON_DISABLED]: gitServer.spec?.tektonDisabled ?? false,
      [NAMES.OVERRIDE_WEBHOOK_URL]: !!gitServer.spec?.webhookUrl,
      [NAMES.WEBHOOK_URL]: gitServer.spec?.webhookUrl || webhookURL || "",
    };
    if (gitServerSecret) {
      base[NAMES.SSH_PRIVATE_KEY] = safeDecode(gitServerSecret.data?.["id_rsa"] ?? "", "");
      base[NAMES.SSH_PUBLIC_KEY] = safeDecode(gitServerSecret.data?.["id_rsa.pub"] ?? "", "");
      base[NAMES.TOKEN] = safeDecode(gitServerSecret.data?.token ?? "", "");
    }
    return base;
  }, [gitServer, gitServerSecret, webhookURL]);

  const handleSubmit = React.useCallback(
    async (values: EditGitServerFormValues) => {
      const gitProviderValue = values[NAMES.GIT_PROVIDER];
      const secretPayload =
        gitProviderValue === gitProvider.gerrit
          ? {
              gitProvider: gitProviderValue as "gerrit",
              sshPrivateKey: values[NAMES.SSH_PRIVATE_KEY],
              sshPublicKey: (values[NAMES.SSH_PUBLIC_KEY] ?? "").trim(),
              currentResource: gitServerSecret,
            }
          : {
              gitProvider: gitProviderValue as "bitbucket" | "github" | "gitlab",
              sshPrivateKey: values[NAMES.SSH_PRIVATE_KEY],
              token: (values[NAMES.TOKEN] ?? "").trim(),
              currentResource: gitServerSecret,
            };

      const initialGitServer = {
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
      };

      const gitServerDirty =
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
          mode: "edit",
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
      } catch (error) {
        console.error("Git Server integration save failed:", error);
        toast.error(error instanceof Error ? error.message : "Failed to save Git Server integration");
        throw error;
      }
    },
    [clusterName, defaultNamespace, gitServer, gitServerSecret, trpc]
  );

  const handleSubmitError = React.useCallback((error: unknown) => {
    console.error("Form submission error:", error);
  }, []);

  return (
    <EditGitServerFormProvider defaultValues={defaultValues} onSubmit={handleSubmit} onSubmitError={handleSubmitError}>
      <DialogHeader>
        <div className="flex flex-row items-start justify-between gap-2">
          <DialogTitle className="text-xl font-medium">Edit Git Server: {gitServer.metadata.name}</DialogTitle>
          <FormGuideToggleButton />
        </div>
      </DialogHeader>
      <DialogBody className="flex min-h-0">
        <div className="flex min-h-0 flex-1 gap-4">
          <div className="min-h-0 flex-1 overflow-y-auto p-0.5">
            <div className="flex flex-col gap-4">
              <GitServerForm ownerReference={ownerReference} />
              <Separator />
              <CredentialsForm ownerReference={ownerReference} />
            </div>
          </div>
          <FormGuidePanel />
        </div>
      </DialogBody>
      <DialogFooter>
        <FormActions onClose={onClose ?? (() => {})} />
      </DialogFooter>
    </EditGitServerFormProvider>
  );
};
