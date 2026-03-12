import { Tooltip } from "@/core/components/ui/tooltip";
import React from "react";
import { useStore } from "@tanstack/react-form";
import { NAMES } from "../../names";
import { useManageGitServerForm } from "../../providers/form/hooks";
import { SSHPrivateKey, SSHPublicKey, Token } from "./components/fields";
import { gitProvider } from "@my-project/shared";
import { ShieldAlert, Shield } from "lucide-react";
import { useDataContext } from "../../providers/Data/hooks";
import { FormSection } from "@/core/components/FormSection";

export const CredentialsForm = () => {
  const form = useManageGitServerForm();
  const gitProviderValue = useStore(form.store, (state) => state.values[NAMES.GIT_PROVIDER]);
  const { gitServerSecret } = useDataContext();
  const gitServerSecretOwnerReference = gitServerSecret?.metadata?.ownerReferences?.[0].kind;

  const secretFieldsRenderer = React.useCallback(() => {
    switch (gitProviderValue) {
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
      case gitProvider.gitlab:
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
      default:
        return null;
    }
  }, [gitProviderValue]);

  return (
    <FormSection
      icon={Shield}
      title="Authentication"
      headerExtra={
        !!gitServerSecretOwnerReference && (
          <Tooltip title={`Managed by ${gitServerSecretOwnerReference}`}>
            <ShieldAlert size={20} />
          </Tooltip>
        )
      }
    >
      <div className="flex flex-col gap-4">{secretFieldsRenderer()}</div>
    </FormSection>
  );
};
