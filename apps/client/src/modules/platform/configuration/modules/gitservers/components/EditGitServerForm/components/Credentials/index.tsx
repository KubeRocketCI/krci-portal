import React from "react";
import { useStore } from "@tanstack/react-form";
import { NAMES } from "../../constants";
import { useEditGitServerForm } from "../../providers/form/hooks";
import { SSHPrivateKey, SSHPublicKey, Token } from "./components/fields";
import { gitProvider } from "@my-project/shared";
import { Tooltip } from "@/core/components/ui/tooltip";
import { ShieldAlert, Shield } from "lucide-react";
import { FormSection } from "@/core/components/FormSection";

export const CredentialsForm: React.FC<{ ownerReference: string | undefined }> = ({ ownerReference }) => {
  const form = useEditGitServerForm();
  const gitProviderValue = useStore(form.store, (state) => state.values[NAMES.GIT_PROVIDER]);

  const secretFieldsRenderer = React.useCallback(() => {
    switch (gitProviderValue) {
      case gitProvider.gerrit:
        return (
          <>
            <div>
              <SSHPrivateKey ownerReference={ownerReference} />
            </div>
            <div>
              <SSHPublicKey ownerReference={ownerReference} />
            </div>
          </>
        );
      case gitProvider.github:
      case gitProvider.gitlab:
      case gitProvider.bitbucket:
        return (
          <>
            <div>
              <SSHPrivateKey ownerReference={ownerReference} />
            </div>
            <div>
              <Token ownerReference={ownerReference} />
            </div>
          </>
        );
      default:
        return null;
    }
  }, [gitProviderValue, ownerReference]);

  return (
    <FormSection
      icon={Shield}
      title="Authentication"
      headerExtra={
        !!ownerReference && (
          <Tooltip title={`Managed by ${ownerReference}`}>
            <ShieldAlert size={20} />
          </Tooltip>
        )
      }
    >
      <div className="flex flex-col gap-4">{secretFieldsRenderer()}</div>
    </FormSection>
  );
};
