import { Grid, useTheme } from "@mui/material";
import React from "react";
import { useFormContext as useReactHookFormContext } from "react-hook-form";
import { CLUSTER_FORM_NAMES } from "../../../../names";
import { ManageClusterSecretDataContext } from "../../../../types";
import {
  CaData,
  ClusterCertificate,
  ClusterHost,
  ClusterName,
  ClusterToken,
  ClusterTypeField,
  RoleARN,
  SkipTLSVerify,
} from "../../../fields";
import { SECRET_LABEL_CLUSTER_TYPE, clusterType, ClusterType } from "@my-project/shared";
import { useFormContext } from "@/core/providers/Form/hooks";
import { FieldEvent } from "@/core/types/forms";

export const Form = () => {
  const theme = useTheme();
  const { watch } = useReactHookFormContext();
  const { formData } = useFormContext<ManageClusterSecretDataContext>();

  const initialClusterType = React.useMemo(() => {
    if (formData.currentElement && typeof formData.currentElement !== "string") {
      return formData.currentElement.metadata?.labels?.[SECRET_LABEL_CLUSTER_TYPE] ?? clusterType.bearer;
    }
    return clusterType.bearer;
  }, [formData.currentElement]);

  const [activeClusterType, setActiveClusterType] = React.useState<ClusterType>(initialClusterType as ClusterType);

  const skipTLSVerify = watch(CLUSTER_FORM_NAMES.SKIP_TLS_VERIFY);

  const renderBearerFormPart = React.useCallback(() => {
    return (
      <>
        <Grid item xs={12}>
          <ClusterToken />
        </Grid>
        <Grid item xs={12} sx={{ mt: theme.typography.pxToRem(20) }}>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={6}>
              <SkipTLSVerify />
            </Grid>
            {!skipTLSVerify && (
              <Grid item xs={6}>
                <ClusterCertificate />
              </Grid>
            )}
          </Grid>
        </Grid>
      </>
    );
  }, [skipTLSVerify, theme.typography]);

  const renderIRSAFormPart = React.useCallback(() => {
    return (
      <>
        <Grid item xs={6}>
          <CaData />
        </Grid>
        <Grid item xs={6}>
          <RoleARN />
        </Grid>
      </>
    );
  }, []);

  const onClusterChange = React.useCallback((event: FieldEvent<ClusterType>) => {
    setActiveClusterType(event.target.value);
  }, []);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <ClusterTypeField onChange={onClusterChange} value={activeClusterType} />
      </Grid>
      <Grid item xs={6}>
        <ClusterName />
      </Grid>
      <Grid item xs={6}>
        <ClusterHost />
      </Grid>
      {activeClusterType === clusterType.bearer ? renderBearerFormPart() : renderIRSAFormPart()}
    </Grid>
  );
};
