import { useRegistryFormsContext } from "../../hooks/useRegistryFormsContext";
import { SHARED_FORM_NAMES } from "../../names";
import { AWSRegion, RegistryEndpoint, RegistrySpace, Type } from "./fields";
import { containerRegistryType } from "@my-project/shared";

export const ConfigMapForm = () => {
  const { sharedForm } = useRegistryFormsContext();

  const registryTypeFieldValue = sharedForm.watch(SHARED_FORM_NAMES.REGISTRY_TYPE);

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
