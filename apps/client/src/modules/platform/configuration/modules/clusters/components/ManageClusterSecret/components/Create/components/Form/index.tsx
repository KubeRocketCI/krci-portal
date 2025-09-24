import { Grid, useTheme } from "@mui/material";
import React from "react";
import { useFormContext } from "react-hook-form";
import { CLUSTER_FORM_NAMES } from "../../../../names";
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
import { FieldEvent } from "@/core/types/forms";
import { clusterType, ClusterType } from "@my-project/shared";

export const Form = ({
  activeClusterType,
  setActiveClusterType,
}: {
  activeClusterType: ClusterType;
  setActiveClusterType: React.Dispatch<React.SetStateAction<ClusterType>>;
}) => {
  const theme = useTheme();
  const { watch } = useFormContext();

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

  const onClusterChange = React.useCallback(
    (event: FieldEvent<ClusterType>) => {
      setActiveClusterType(event.target.value);
    },
    [setActiveClusterType]
  );

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <ClusterTypeField value={activeClusterType} onChange={onClusterChange} />
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
