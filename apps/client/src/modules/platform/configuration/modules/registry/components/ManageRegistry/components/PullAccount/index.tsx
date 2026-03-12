import { useStore } from "@tanstack/react-form";
import { Tooltip } from "@/core/components/ui/tooltip";
import { useDataContext } from "../../providers/Data/hooks";
import { PullAccountPassword, PullAccountUser } from "./fields";
import {
  SECRET_ANNOTATION_INTEGRATION_SECRET_CONNECTED,
  SECRET_ANNOTATION_INTEGRATION_SECRET_ERROR,
} from "@my-project/shared";
import { StatusIcon } from "@/core/components/StatusIcon";
import { getIntegrationSecretStatusIcon } from "@/k8s/integrations/secret/utils/getStatusIcon";
import { ShieldAlert } from "lucide-react";
import { useManageRegistryForm } from "../../providers/form/hooks";
import { NAMES } from "../../schema";
import { Card } from "@/core/components/ui/card";

export const PullAccountForm = () => {
  const form = useManageRegistryForm();
  const { pullAccountSecret } = useDataContext();

  const useSameAccountFieldValue = useStore(form.store, (state) => state.values[NAMES.USE_SAME_ACCOUNT]);

  const pullAccountOwnerReference = pullAccountSecret?.metadata?.ownerReferences?.[0].kind;

  const pullAccountConnected =
    pullAccountSecret?.metadata?.annotations?.[SECRET_ANNOTATION_INTEGRATION_SECRET_CONNECTED];
  const pullAccountError = pullAccountSecret?.metadata?.annotations?.[SECRET_ANNOTATION_INTEGRATION_SECRET_ERROR];

  if (!pullAccountSecret) {
    return null;
  }

  const statusIcon = getIntegrationSecretStatusIcon(pullAccountSecret);

  return (
    <Card className="border-input border bg-transparent p-3">
      <div className="mb-4 flex items-center gap-2">
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
        <h5 className="text-foreground text-sm font-medium">Pull Account</h5>
        {!!pullAccountOwnerReference && (
          <Tooltip title={`Managed by ${pullAccountOwnerReference}`}>
            <ShieldAlert size={15} />
          </Tooltip>
        )}
      </div>
      {!useSameAccountFieldValue && (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-6">
            <PullAccountUser />
          </div>
          <div className="col-span-6">
            <PullAccountPassword />
          </div>
        </div>
      )}
    </Card>
  );
};
