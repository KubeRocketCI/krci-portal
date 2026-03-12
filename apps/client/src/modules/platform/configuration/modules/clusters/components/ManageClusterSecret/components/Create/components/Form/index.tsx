import React from "react";
import { FieldEvent } from "@/core/types/forms";
import { ClusterType } from "@my-project/shared";
import { ClusterFormFields } from "../../../ClusterFormFields";

export const Form = ({
  activeClusterType,
  setActiveClusterType,
}: {
  activeClusterType: ClusterType;
  setActiveClusterType: React.Dispatch<React.SetStateAction<ClusterType>>;
}) => {
  const onClusterChange = React.useCallback(
    (event: FieldEvent<ClusterType>) => {
      setActiveClusterType(event.target.value);
    },
    [setActiveClusterType]
  );

  return <ClusterFormFields activeClusterType={activeClusterType} onClusterTypeChange={onClusterChange} />;
};
