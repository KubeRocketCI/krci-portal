import { Grid, Tooltip, Typography } from "@mui/material";
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
                        {`Connected: ${pullAccountConnected === undefined ? "Unknown" : pullAccountConnected}`}
                      </Typography>
                      {!!pullAccountError && (
                        <Typography variant={"subtitle2"} sx={{ mt: (t) => t.typography.pxToRem(10) }}>
                          {pullAccountError}
                        </Typography>
                      )}
                    </>
                  }
                  width={20}
                />
              </Grid>
              <Grid item>
                <Typography variant={"h6"}>Pull Account</Typography>
              </Grid>
              {!!pullAccountOwnerReference && (
                <Grid item>
                  <Tooltip title={`Managed by ${pullAccountOwnerReference}`}>
                    <ShieldX size={15} />
                  </Tooltip>
                </Grid>
              )}
            </Grid>
          </Grid>
          {!useSameAccountFieldValue && (
            <>
              <Grid item xs={6}>
                <PullAccountUser />
              </Grid>
              <Grid item xs={6}>
                <PullAccountPassword />
              </Grid>
            </>
          )}
        </Grid>
      </Grid>
    </>
  );
};
