import { Tooltip } from "@mui/material";
import { useRegistryFormsContext } from "../../hooks/useRegistryFormsContext";
import { SHARED_FORM_NAMES } from "../../names";
import { useDataContext } from "../../providers/Data/hooks";
import { PushAccountPassword, PushAccountUser } from "./fields";
import {
  containerRegistryType,
  SECRET_ANNOTATION_INTEGRATION_SECRET_CONNECTED,
  SECRET_ANNOTATION_INTEGRATION_SECRET_ERROR,
} from "@my-project/shared";
import { StatusIcon } from "@/core/components/StatusIcon";
import { ShieldX } from "lucide-react";
import { getIntegrationSecretStatusIcon } from "@/k8s/integrations/secret/utils/getStatusIcon";

export const PushAccountForm = () => {
  const { pushAccountSecret } = useDataContext();

  const { sharedForm } = useRegistryFormsContext();

  const registryTypeFieldValue = sharedForm.watch(SHARED_FORM_NAMES.REGISTRY_TYPE);
  const pushAccountOwnerReference = pushAccountSecret?.metadata?.ownerReferences?.[0].kind;

  const pushAccountConnected =
    pushAccountSecret?.metadata?.annotations?.[SECRET_ANNOTATION_INTEGRATION_SECRET_CONNECTED];
  const pushAccountError = pushAccountSecret?.metadata?.annotations?.[SECRET_ANNOTATION_INTEGRATION_SECRET_ERROR];

  if (!pushAccountSecret) {
    return null;
  }

  const statusIcon = getIntegrationSecretStatusIcon(pushAccountSecret);

  return (
    <>
      <div>
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex gap-2 items-center">
              <div>
                <StatusIcon
                  Icon={statusIcon.component}
                  color={statusIcon.color}
                  Title={
                    <>
                      <p className="text-sm font-semibold">
                        {`Connected: ${pushAccountConnected === undefined ? "Unknown" : pushAccountConnected}`}
                      </p>
                      {!!pushAccountError && (
                        <p className="text-sm font-medium mt-3">
                          {pushAccountError}
                        </p>
                      )}
                    </>
                  }
                  width={20}
                />
              </div>
              <div>
                <h6 className="text-base font-medium">Push Account</h6>
              </div>
              {!!pushAccountOwnerReference && (
                <div>
                  <Tooltip title={`Managed by ${pushAccountOwnerReference}`}>
                    <ShieldX size={15} />
                  </Tooltip>
                </div>
              )}
            </div>
          </div>
          {registryTypeFieldValue !== containerRegistryType.openshift && (
            <div className="col-span-6">
              <PushAccountUser />
            </div>
          )}
          <div className="col-span-6">
            <PushAccountPassword />
          </div>
        </div>
      </div>
    </>
  );
};
