import { Tooltip } from "@mui/material";
import React from "react";
import { useFormsContext } from "../../hooks/useFormsContext";
import { GIT_SERVER_FORM_NAMES } from "../../names";
import { SSHPrivateKey, SSHPublicKey, Token } from "./components/fields";
import { createGitServerSecretName, GitProvider, gitProvider } from "@my-project/shared";
import { ShieldX } from "lucide-react";
import { useSecretWatchItem } from "@/k8s/api/groups/Core/Secret";

export const CredentialsForm = () => {
  const { sharedForm } = useFormsContext();

  const gitProviderSharedValue = sharedForm.watch(GIT_SERVER_FORM_NAMES.GIT_PROVIDER);

  const gitServerSecretWatch = useSecretWatchItem({
    name: createGitServerSecretName((gitProviderSharedValue as GitProvider) || ""),
  });

  const gitServerSecret = gitServerSecretWatch.query.data;

  const gitServerSecretOwnerReference = gitServerSecret?.metadata?.ownerReferences?.[0].kind;

  const sharedGitProviderValue = sharedForm.watch(GIT_SERVER_FORM_NAMES.GIT_PROVIDER);

  const secretFieldsRenderer = React.useCallback(() => {
    switch (sharedGitProviderValue) {
      case gitProvider.gerrit:
        return (
          <>
            <div>
              <SSHPrivateKey />
            </div>
            <div>
              <SSHPublicKey />
            </div>
          </>
        );
      case gitProvider.github:
        return (
          <>
            <div>
              <SSHPrivateKey />
            </div>
            <div>
              <Token />
            </div>
          </>
        );
      case gitProvider.gitlab:
        return (
          <>
            <div>
              <SSHPrivateKey />
            </div>
            <div>
              <Token />
            </div>
          </>
        );
      case gitProvider.bitbucket:
        return (
          <>
            <div>
              <SSHPrivateKey />
            </div>
            <div>
              <Token />
            </div>
          </>
        );
    }
  }, [sharedGitProviderValue]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex gap-2 items-center">
          <div>
            <h6 className="text-base font-medium">Credentials</h6>
          </div>
          {!!gitServerSecretOwnerReference && (
            <div>
              <Tooltip title={`Managed by ${gitServerSecretOwnerReference}`}>
                <ShieldX size={20} />
              </Tooltip>
            </div>
          )}
        </div>
      </div>
      <div>
        <div className="flex flex-col gap-4">
          {secretFieldsRenderer()}
        </div>
      </div>
    </div>
  );
};
