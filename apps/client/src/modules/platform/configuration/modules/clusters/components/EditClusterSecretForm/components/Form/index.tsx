import React from "react";
import { useClusterSecretData } from "../../providers/data/hooks";
import { SECRET_LABEL_CLUSTER_TYPE, clusterType, ClusterType } from "@my-project/shared";
import { FieldEvent } from "@/core/types/forms";
import { ClusterFormFields } from "../ClusterFormFields";

export const Form = () => {
  const formData = useClusterSecretData();

  const initialClusterType = React.useMemo(() => {
    if (formData.currentElement && typeof formData.currentElement !== "string") {
      return formData.currentElement.metadata?.labels?.[SECRET_LABEL_CLUSTER_TYPE] ?? clusterType.bearer;
    }
    return clusterType.bearer;
  }, [formData.currentElement]);

  const [activeClusterType, setActiveClusterType] = React.useState<ClusterType>(initialClusterType as ClusterType);

  const onClusterChange = React.useCallback((event: FieldEvent<ClusterType>) => {
    setActiveClusterType(event.target.value);
  }, []);

  return <ClusterFormFields activeClusterType={activeClusterType} onClusterTypeChange={onClusterChange} />;
};
