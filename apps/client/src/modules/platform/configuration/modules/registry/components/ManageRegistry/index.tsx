import { Grid } from "@mui/material";
import { Actions } from "./components/Actions";
import { ConfigMapForm } from "./components/ConfigMap";
import { UseSameAccount } from "./components/fields";
import { PullAccountForm } from "./components/PullAccount";
import { PushAccountForm } from "./components/PushAccount";
import { ServiceAccountForm } from "./components/ServiceAccount";
import { useConfigMapEditForm } from "./hooks/useConfigMapEditForm";
import { usePullAccountCreateForm } from "./hooks/usePullAccountCreateForm";
import { usePullAccountEditForm } from "./hooks/usePullAccountEditForm";
import { usePushAccountCreateForm } from "./hooks/usePushAccountCreateForm";
import { usePushAccountEditForm } from "./hooks/usePushAccountEditForm";
import { useServiceAccountEditForm } from "./hooks/useServiceAccountEditForm";
import { useSharedForm } from "./hooks/useSharedForm";
import { SHARED_FORM_NAMES } from "./names";
import { DataContextProvider } from "./providers/Data";
import { FormNames, ManageRegistryProps } from "./types";
import { MultiFormContextProvider } from "@/core/providers/MultiForm/provider";
import { containerRegistryType } from "@my-project/shared";

const satisfiesType = (registryType: string, allowedTypes: string[]) => {
  return registryType && allowedTypes.includes(registryType);
};

export const ManageRegistry = ({
  EDPConfigMap,
  pushAccountSecret,
  pullAccountSecret,
  tektonServiceAccount,
  handleCloseCreateDialog,
}: ManageRegistryProps) => {
  const sharedForm = useSharedForm({
    EDPConfigMap,
    pushAccountSecret,
    pullAccountSecret,
  });

  const registryTypeFieldValue = sharedForm.form.watch(SHARED_FORM_NAMES.REGISTRY_TYPE);

  const pushAccountCreateForm = usePushAccountCreateForm({
    pushAccountSecret,
    sharedForm: sharedForm.form,
  });

  const pushAccountEditForm = usePushAccountEditForm({
    pushAccountSecret,
    sharedForm: sharedForm.form,
  });

  const pullAccountCreateForm = usePullAccountCreateForm({
    pullAccountSecret,
    sharedForm: sharedForm.form,
  });

  const pullAccountEditForm = usePullAccountEditForm({
    pullAccountSecret,
    sharedForm: sharedForm.form,
  });

  const configMapEditForm = useConfigMapEditForm({
    EDPConfigMap,
  });

  const serviceAccountEditForm = useServiceAccountEditForm({
    tektonServiceAccount,
  });

  const pushAccountForm = pushAccountSecret ? pushAccountEditForm : pushAccountCreateForm;
  const pullAccountForm = pullAccountSecret ? pullAccountEditForm : pullAccountCreateForm;

  return (
    <div data-testid="form">
      <DataContextProvider
        EDPConfigMap={EDPConfigMap}
        pushAccountSecret={pushAccountSecret}
        pullAccountSecret={pullAccountSecret}
        tektonServiceAccount={tektonServiceAccount}
      >
        <MultiFormContextProvider<FormNames>
          forms={{
            pushAccount: pushAccountForm,
            pullAccount: pullAccountForm,
            configMap: configMapEditForm,
            serviceAccount: serviceAccountEditForm,
          }}
          sharedForm={sharedForm.form}
        >
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <ConfigMapForm />
            </Grid>
            {satisfiesType(registryTypeFieldValue, [containerRegistryType.ecr]) && (
              <Grid item xs={12}>
                <ServiceAccountForm />
              </Grid>
            )}
            {satisfiesType(registryTypeFieldValue, [
              containerRegistryType.harbor,
              containerRegistryType.nexus,
              containerRegistryType.openshift,
              containerRegistryType.dockerhub,
              containerRegistryType.ghcr,
            ]) && (
              <Grid item xs={12}>
                <PushAccountForm />
              </Grid>
            )}
            {satisfiesType(registryTypeFieldValue, [
              containerRegistryType.harbor,
              containerRegistryType.nexus,
              containerRegistryType.dockerhub,
              containerRegistryType.ghcr,
            ]) && (
              <Grid item xs={12}>
                <UseSameAccount />
              </Grid>
            )}
            {satisfiesType(registryTypeFieldValue, [
              containerRegistryType.harbor,
              containerRegistryType.nexus,
              containerRegistryType.dockerhub,
              containerRegistryType.ghcr,
            ]) && (
              <Grid item xs={12}>
                <PullAccountForm />
              </Grid>
            )}
            <Grid item xs={12}>
              <Actions handleCloseCreateDialog={handleCloseCreateDialog} />
            </Grid>
          </Grid>
        </MultiFormContextProvider>
      </DataContextProvider>
    </div>
  );
};
