import React from "react";
import { useStore } from "@tanstack/react-form";
import { NAMES } from "../../constants";
import { useCreateGitServerForm } from "../../providers/form/hooks";
import { SSHPrivateKey, SSHPublicKey, Token } from "./components/fields";
import { gitProvider } from "@my-project/shared";
import { Shield } from "lucide-react";
import { FormSection } from "@/core/components/FormSection";

export const CredentialsForm = () => {
  const form = useCreateGitServerForm();
  const gitProviderValue = useStore(form.store, (state) => state.values[NAMES.GIT_PROVIDER]);

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
    <FormSection icon={Shield} title="Authentication">
      <div className="flex flex-col gap-4">{secretFieldsRenderer()}</div>
    </FormSection>
  );
};
