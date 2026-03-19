import { useStore } from "@tanstack/react-form";
import { PushAccountPassword, PushAccountUser } from "../fields";
import { containerRegistryType } from "@my-project/shared";
import { Lock } from "lucide-react";
import { useCreateRegistryForm } from "../../providers/form/hooks";
import { NAMES } from "../../constants";
import { FormSection } from "@/core/components/FormSection";

export const PushAccountForm = () => {
  const form = useCreateRegistryForm();

  const registryTypeFieldValue = useStore(form.store, (state) => state.values[NAMES.REGISTRY_TYPE]);

  return (
    <FormSection icon={Lock} title="Push Account">
      <div className="grid grid-cols-12 gap-4">
        {registryTypeFieldValue !== containerRegistryType.openshift && (
          <div className="col-span-6">
            <PushAccountUser />
          </div>
        )}
        <div className={registryTypeFieldValue !== containerRegistryType.openshift ? "col-span-6" : "col-span-12"}>
          <PushAccountPassword />
        </div>
      </div>
    </FormSection>
  );
};
