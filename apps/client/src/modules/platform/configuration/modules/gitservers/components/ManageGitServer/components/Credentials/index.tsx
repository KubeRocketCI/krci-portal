import { Tooltip } from "@/core/components/ui/tooltip";
import React from "react";
import { useStore } from "@tanstack/react-form";
import { NAMES } from "../../names";
import { useManageGitServerForm } from "../../providers/form/hooks";
import { SSHPrivateKey, SSHPublicKey, Token } from "./components/fields";
import { gitProvider } from "@my-project/shared";
import { ShieldX } from "lucide-react";
import { useDataContext } from "../../providers/Data/hooks";

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
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center gap-2">
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
        <div className="flex flex-col gap-4">{secretFieldsRenderer()}</div>
      </div>
    </div>
  );
};
