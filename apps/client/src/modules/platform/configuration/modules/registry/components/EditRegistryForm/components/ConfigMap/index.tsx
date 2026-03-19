import { useStore } from "@tanstack/react-form";
import { AWSRegion, RegistryEndpoint, RegistrySpace, Type } from "../fields";
import { containerRegistryType, ContainerRegistryPlatform } from "@my-project/shared";
import { useEditRegistryForm } from "../../providers/form/hooks";
import { NAMES } from "../../constants";
import { Boxes } from "lucide-react";
import { FormSection } from "@/core/components/FormSection";

interface ConfigMapProps {
  platform?: ContainerRegistryPlatform;
}

export const ConfigMapForm = ({ platform }: ConfigMapProps) => {
  const form = useEditRegistryForm();

  const registryTypeFieldValue = useStore(form.store, (state) => state.values[NAMES.REGISTRY_TYPE]);

  return (
    <FormSection icon={Boxes} title="Registry Configuration">
      <div className="flex flex-col gap-6">
        <div>
          <Type platform={platform} />
        </div>
        <div>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6">
              <RegistryEndpoint />
            </div>
            <div className="col-span-6">
              <RegistrySpace />
            </div>
          </div>
        </div>
        {registryTypeFieldValue === containerRegistryType.ecr && (
          <div>
            <AWSRegion />
          </div>
        )}
      </div>
    </FormSection>
  );
};
