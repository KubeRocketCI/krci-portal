import { useTheme } from "@mui/material";
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
        <div>
          <ClusterToken />
        </div>
        <div style={{ marginTop: theme.typography.pxToRem(20) }}>
          <div className="grid grid-cols-12 items-end gap-4">
            <div className="col-span-6">
              <SkipTLSVerify />
            </div>
            {!skipTLSVerify && (
              <div className="col-span-6">
                <ClusterCertificate />
              </div>
            )}
          </div>
        </div>
      </>
    );
  }, [skipTLSVerify, theme.typography]);

  const renderIRSAFormPart = React.useCallback(() => {
    return (
      <>
        <div className="col-span-6">
          <CaData />
        </div>
        <div className="col-span-6">
          <RoleARN />
        </div>
      </>
    );
  }, []);

  const onClusterChange = React.useCallback((event: FieldEvent<ClusterType>) => {
    setActiveClusterType(event.target.value);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <ClusterTypeField onChange={onClusterChange} value={activeClusterType} />
      </div>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-6">
          <ClusterName />
        </div>
        <div className="col-span-6">
          <ClusterHost />
        </div>
      </div>
      {activeClusterType === clusterType.bearer ? renderBearerFormPart() : renderIRSAFormPart()}
    </div>
  );
};
