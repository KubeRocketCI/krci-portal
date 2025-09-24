import { Grid } from "@mui/material";
import { useRegistryFormsContext } from "../../hooks/useRegistryFormsContext";
import { SHARED_FORM_NAMES } from "../../names";
import { AWSRegion, RegistryEndpoint, RegistrySpace, Type } from "./fields";
import { containerRegistryType } from "@my-project/shared";

export const ConfigMapForm = () => {
  const { sharedForm } = useRegistryFormsContext();

  const registryTypeFieldValue = sharedForm.watch(SHARED_FORM_NAMES.REGISTRY_TYPE);

  return (
    <Grid container spacing={4}>
      <Grid item xs={12}>
        <Type />
      </Grid>
      <Grid item xs={12}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <RegistryEndpoint />
          </Grid>
          <Grid item xs={6}>
            <RegistrySpace />
          </Grid>
        </Grid>
      </Grid>
      {registryTypeFieldValue === containerRegistryType.ecr && (
        <Grid item xs={12}>
          <AWSRegion />
        </Grid>
      )}
    </Grid>
  );
};
