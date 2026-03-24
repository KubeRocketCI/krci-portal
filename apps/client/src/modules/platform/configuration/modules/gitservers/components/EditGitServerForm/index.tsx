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
import { showToast } from "@/core/components/Snackbar";
import { gitProvider } from "@my-project/shared";
import { Separator } from "@/core/components/ui/separator";
import type { GitServer } from "@my-project/shared";
import type { AnyFormApi } from "@tanstack/react-form";

const GIT_SERVER_FIELDS = [
  NAMES.NAME,
  NAMES.GIT_HOST,
  NAMES.GIT_PROVIDER,
  NAMES.GIT_USER,
  NAMES.NAME_SSH_KEY_SECRET,
  NAMES.SSH_PORT,
  NAMES.HTTPS_PORT,
  NAMES.SKIP_WEBHOOK_SSL,
  NAMES.TEKTON_DISABLED,
  NAMES.OVERRIDE_WEBHOOK_URL,
  NAMES.WEBHOOK_URL,
] as const;

const SECRET_FIELDS = [NAMES.SSH_PRIVATE_KEY, NAMES.SSH_PUBLIC_KEY, NAMES.TOKEN] as const;

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
    async (values: EditGitServerFormValues, formApi: AnyFormApi) => {
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

      const gitServerDirty = GIT_SERVER_FIELDS.some((name) => formApi.getFieldMeta(name)?.isDirty);
      const secretDirty = !gitServerSecret || SECRET_FIELDS.some((name) => formApi.getFieldMeta(name)?.isDirty);

      const loadingToastId = showToast("Saving Git Server integration", "loading");
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

        showToast(result.data?.message ?? "Git Server integration saved successfully", "success", {
          id: loadingToastId,
          duration: 5000,
        });
      } catch (error) {
        console.error("Git Server integration save failed:", error);
        showToast("Failed to save Git Server integration", "error", {
          id: loadingToastId,
          duration: 10000,
          description: error instanceof Error ? error.message : String(error),
        });
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
