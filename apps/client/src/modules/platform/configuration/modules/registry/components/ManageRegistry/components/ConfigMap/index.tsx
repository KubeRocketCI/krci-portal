import { useStore } from "@tanstack/react-form";
import { AWSRegion, RegistryEndpoint, RegistrySpace, Type } from "./fields";
import { containerRegistryType } from "@my-project/shared";
import { useManageRegistryForm } from "../../providers/form/hooks";
import { NAMES } from "../../schema";

export const ConfigMapForm = () => {
  const form = useManageRegistryForm();

  const registryTypeFieldValue = useStore(form.store, (state) => state.values[NAMES.REGISTRY_TYPE]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Type />
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
  );
};
