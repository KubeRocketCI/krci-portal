import React from "react";
import { CaData, ClusterHost, ClusterName, ClusterToken, ClusterTypeField, RoleARN, SkipTLSVerify } from "../fields";
import { FieldEvent } from "@/core/types/forms";
import { clusterType, ClusterType } from "@my-project/shared";
import { Separator } from "@/core/components/ui/separator";
import { Boxes, Shield } from "lucide-react";
import { FormSection } from "@/core/components/FormSection";

interface ClusterFormFieldsProps {
  activeClusterType: ClusterType;
  onClusterTypeChange: (event: FieldEvent<ClusterType>) => void;
}

export function ClusterFormFields({ activeClusterType, onClusterTypeChange }: ClusterFormFieldsProps) {
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

  return (
    <div className="flex flex-col gap-4">
      <FormSection icon={Boxes} title="Cluster Configuration">
        <div className="flex flex-col gap-4">
          <ClusterTypeField value={activeClusterType} onChange={onClusterTypeChange} />
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6">
              <ClusterName />
            </div>
            <div className="col-span-6">
              <ClusterHost />
            </div>
          </div>
        </div>
      </FormSection>

      <Separator />

      <FormSection icon={Shield} title="Authentication">
        {activeClusterType === clusterType.bearer ? renderBearerFormPart() : renderIRSAFormPart()}
      </FormSection>
    </div>
  );
}
