import React from "react";
import { useClusterSecretData } from "../../../../providers/data/hooks";
import {
  CaData,
  ClusterHost,
  ClusterName,
  ClusterToken,
  ClusterTypeField,
  RoleARN,
  SkipTLSVerify,
} from "../../../fields";
import { SECRET_LABEL_CLUSTER_TYPE, clusterType, ClusterType } from "@my-project/shared";
import { FieldEvent } from "@/core/types/forms";

export const Form = () => {
  const formData = useClusterSecretData();

  const initialClusterType = React.useMemo(() => {
    if (formData.currentElement && typeof formData.currentElement !== "string") {
      return formData.currentElement.metadata?.labels?.[SECRET_LABEL_CLUSTER_TYPE] ?? clusterType.bearer;
    }
    return clusterType.bearer;
  }, [formData.currentElement]);

  const [activeClusterType, setActiveClusterType] = React.useState<ClusterType>(initialClusterType as ClusterType);

  const renderBearerFormPart = React.useCallback(() => {
    return (
      <>
        <div>
          <ClusterToken />
        </div>
        <div className="mt-5">
          <SkipTLSVerify />
        </div>
      </>
    );
  }, []);

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
