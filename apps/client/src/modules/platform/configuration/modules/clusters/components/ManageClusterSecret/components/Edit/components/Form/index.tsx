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
import { Card } from "@/core/components/ui/card";
import { Separator } from "@/core/components/ui/separator";
import { Boxes, Shield } from "lucide-react";

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
      <div className="flex flex-col gap-4">
        <ClusterToken />
        <SkipTLSVerify />
      </div>
    );
  }, []);

  const renderIRSAFormPart = React.useCallback(() => {
    return (
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-6">
          <CaData />
        </div>
        <div className="col-span-6">
          <RoleARN />
        </div>
      </div>
    );
  }, []);

  const onClusterChange = React.useCallback((event: FieldEvent<ClusterType>) => {
    setActiveClusterType(event.target.value);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-input border bg-transparent p-3">
        <div className="mb-4 flex items-center gap-2">
          <Boxes className="h-4 w-4 text-blue-600" />
          <h5 className="text-foreground text-sm font-medium">Cluster Configuration</h5>
        </div>
        <div className="flex flex-col gap-4">
          <ClusterTypeField onChange={onClusterChange} value={activeClusterType} />
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6">
              <ClusterName />
            </div>
            <div className="col-span-6">
              <ClusterHost />
            </div>
          </div>
        </div>
      </Card>

      <Separator />

      <Card className="border-input border bg-transparent p-3">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-600" />
          <h5 className="text-foreground text-sm font-medium">Authentication</h5>
        </div>
        {activeClusterType === clusterType.bearer ? renderBearerFormPart() : renderIRSAFormPart()}
      </Card>
    </div>
  );
};
