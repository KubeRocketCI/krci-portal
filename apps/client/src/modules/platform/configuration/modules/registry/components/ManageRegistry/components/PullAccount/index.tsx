import { Tooltip } from "@mui/material";
import { useRegistryFormsContext } from "../../hooks/useRegistryFormsContext";
import { SHARED_FORM_NAMES } from "../../names";
import { useDataContext } from "../../providers/Data/hooks";
import { PullAccountPassword, PullAccountUser } from "./fields";
import {
  SECRET_ANNOTATION_INTEGRATION_SECRET_CONNECTED,
  SECRET_ANNOTATION_INTEGRATION_SECRET_ERROR,
} from "@my-project/shared";
import { StatusIcon } from "@/core/components/StatusIcon";
import { getIntegrationSecretStatusIcon } from "@/k8s/integrations/secret/utils/getStatusIcon";
import { ShieldX } from "lucide-react";

export const PullAccountForm = () => {
  const { sharedForm } = useRegistryFormsContext();
  const { pullAccountSecret } = useDataContext();

  const useSameAccountFieldValue = sharedForm.watch(SHARED_FORM_NAMES.USE_SAME_ACCOUNT);

  const pullAccountOwnerReference = pullAccountSecret?.metadata?.ownerReferences?.[0].kind;

  const pullAccountConnected =
    pullAccountSecret?.metadata?.annotations?.[SECRET_ANNOTATION_INTEGRATION_SECRET_CONNECTED];
  const pullAccountError = pullAccountSecret?.metadata?.annotations?.[SECRET_ANNOTATION_INTEGRATION_SECRET_ERROR];

  if (!pullAccountSecret) {
    return null;
  }

  const statusIcon = getIntegrationSecretStatusIcon(pullAccountSecret);

  return (
    <>
      <div>
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div>
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
              </div>
              <div>
                <h6 className="text-base font-medium">Pull Account</h6>
              </div>
              {!!pullAccountOwnerReference && (
                <div>
                  <Tooltip title={`Managed by ${pullAccountOwnerReference}`}>
                    <ShieldX size={15} />
                  </Tooltip>
                </div>
              )}
            </div>
          </div>
          {!useSameAccountFieldValue && (
            <>
              <div className="col-span-6">
                <PullAccountUser />
              </div>
              <div className="col-span-6">
                <PullAccountPassword />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};
