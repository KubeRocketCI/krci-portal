import { useStore } from "@tanstack/react-form";
import { Tooltip } from "@/core/components/ui/tooltip";
import { PushAccountPassword, PushAccountUser } from "../fields";
import {
  containerRegistryType,
  SECRET_ANNOTATION_INTEGRATION_SECRET_CONNECTED,
  SECRET_ANNOTATION_INTEGRATION_SECRET_ERROR,
  Secret,
} from "@my-project/shared";
import { StatusIcon } from "@/core/components/StatusIcon";
import { Lock, ShieldAlert } from "lucide-react";
import { getIntegrationSecretStatusIcon } from "@/k8s/integrations/secret/utils/getStatusIcon";
import { useEditRegistryForm } from "../../providers/form/hooks";
import { NAMES } from "../../constants";
import { FormSection } from "@/core/components/FormSection";

interface PushAccountFormProps {
  pushAccountSecret?: Secret;
}

export const PushAccountForm = ({ pushAccountSecret }: PushAccountFormProps) => {
  const form = useEditRegistryForm();

  const registryTypeFieldValue = useStore(form.store, (state) => state.values[NAMES.REGISTRY_TYPE]);
  const pushAccountOwnerReference = pushAccountSecret?.metadata?.ownerReferences?.[0]?.kind;

  const pushAccountConnected =
    pushAccountSecret?.metadata?.annotations?.[SECRET_ANNOTATION_INTEGRATION_SECRET_CONNECTED];
  const pushAccountError = pushAccountSecret?.metadata?.annotations?.[SECRET_ANNOTATION_INTEGRATION_SECRET_ERROR];

  if (!pushAccountSecret) {
    return null;
  }

  const statusIcon = getIntegrationSecretStatusIcon(pushAccountSecret);

  return (
    <FormSection
      icon={Lock}
      title="Push Account"
      headerExtra={
        <div className="flex items-center gap-2">
          <StatusIcon
            Icon={statusIcon.component}
            color={statusIcon.color}
            Title={
              <>
                <p className="text-sm font-semibold">
                  {`Connected: ${pushAccountConnected === undefined ? "Unknown" : pushAccountConnected}`}
                </p>
                {!!pushAccountError && <p className="mt-3 text-sm font-medium">{pushAccountError}</p>}
              </>
            }
            width={20}
          />
          {!!pushAccountOwnerReference && (
            <Tooltip title={`Managed by ${pushAccountOwnerReference}`}>
              <ShieldAlert size={15} />
            </Tooltip>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-12 gap-4">
        {registryTypeFieldValue !== containerRegistryType.openshift && (
          <div className="col-span-6">
            <PushAccountUser ownerReference={pushAccountOwnerReference} />
          </div>
        )}
        <div className={registryTypeFieldValue !== containerRegistryType.openshift ? "col-span-6" : "col-span-12"}>
          <PushAccountPassword ownerReference={pushAccountOwnerReference} />
        </div>
      </div>
    </FormSection>
  );
};
