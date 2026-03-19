import { useStore } from "@tanstack/react-form";
import { Tooltip } from "@/core/components/ui/tooltip";
import { PullAccountPassword, PullAccountUser } from "../fields";
import {
  SECRET_ANNOTATION_INTEGRATION_SECRET_CONNECTED,
  SECRET_ANNOTATION_INTEGRATION_SECRET_ERROR,
  Secret,
} from "@my-project/shared";
import { StatusIcon } from "@/core/components/StatusIcon";
import { getIntegrationSecretStatusIcon } from "@/k8s/integrations/secret/utils/getStatusIcon";
import { Lock, ShieldAlert } from "lucide-react";
import { useEditRegistryForm } from "../../providers/form/hooks";
import { NAMES } from "../../constants";
import { FormSection } from "@/core/components/FormSection";

interface PullAccountFormProps {
  pullAccountSecret?: Secret;
}

export const PullAccountForm = ({ pullAccountSecret }: PullAccountFormProps) => {
  const form = useEditRegistryForm();

  const useSameAccountFieldValue = useStore(form.store, (state) => state.values[NAMES.USE_SAME_ACCOUNT]);

  const pullAccountOwnerReference = pullAccountSecret?.metadata?.ownerReferences?.[0]?.kind;

  const pullAccountConnected =
    pullAccountSecret?.metadata?.annotations?.[SECRET_ANNOTATION_INTEGRATION_SECRET_CONNECTED];
  const pullAccountError = pullAccountSecret?.metadata?.annotations?.[SECRET_ANNOTATION_INTEGRATION_SECRET_ERROR];

  if (!pullAccountSecret) {
    return null;
  }

  const statusIcon = getIntegrationSecretStatusIcon(pullAccountSecret);

  return (
    <FormSection
      icon={Lock}
      title="Pull Account"
      headerExtra={
        <div className="flex items-center gap-2">
          <StatusIcon
            Icon={statusIcon.component}
            color={statusIcon.color}
            Title={
              <>
                <p className="text-sm font-semibold">
                  {`Connected: ${pullAccountConnected === undefined ? "Unknown" : pullAccountConnected}`}
                </p>
                {!!pullAccountError && <p className="mt-3 text-sm font-medium">{pullAccountError}</p>}
              </>
            }
            width={20}
          />
          {!!pullAccountOwnerReference && (
            <Tooltip title={`Managed by ${pullAccountOwnerReference}`}>
              <ShieldAlert size={15} />
            </Tooltip>
          )}
        </div>
      }
    >
      {!useSameAccountFieldValue && (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-6">
            <PullAccountUser ownerReference={pullAccountOwnerReference} />
          </div>
          <div className="col-span-6">
            <PullAccountPassword ownerReference={pullAccountOwnerReference} />
          </div>
        </div>
      )}
    </FormSection>
  );
};
