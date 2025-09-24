import { Grid, Tooltip, Typography } from "@mui/material";
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
      <Grid item xs={12}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Grid container spacing={1} alignItems={"center"}>
              <Grid item>
                <StatusIcon
                  Icon={statusIcon.component}
                  color={statusIcon.color}
                  Title={
                    <>
                      <Typography variant={"subtitle2"} style={{ fontWeight: 600 }}>
                        {`Connected: ${pushAccountConnected === undefined ? "Unknown" : pushAccountConnected}`}
                      </Typography>
                      {!!pushAccountError && (
                        <Typography variant={"subtitle2"} sx={{ mt: (t) => t.typography.pxToRem(10) }}>
                          {pushAccountError}
                        </Typography>
                      )}
                    </>
                  }
                  width={20}
                />
              </Grid>
              <Grid item>
                <Typography variant={"h6"}>Push Account</Typography>
              </Grid>
              {!!pushAccountOwnerReference && (
                <Grid item>
                  <Tooltip title={`Managed by ${pushAccountOwnerReference}`}>
                    <ShieldX size={15} />
                  </Tooltip>
                </Grid>
              )}
            </Grid>
          </Grid>
          {registryTypeFieldValue !== containerRegistryType.openshift && (
            <Grid item xs={6}>
              <PushAccountUser />
            </Grid>
          )}
          <Grid item xs={6}>
            <PushAccountPassword />
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};
