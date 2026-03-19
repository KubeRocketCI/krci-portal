import { useStore } from "@tanstack/react-form";
import { PullAccountPassword, PullAccountUser } from "../fields";
import { Lock } from "lucide-react";
import { useCreateRegistryForm } from "../../providers/form/hooks";
import { NAMES } from "../../constants";
import { FormSection } from "@/core/components/FormSection";

export const PullAccountForm = () => {
  const form = useCreateRegistryForm();

  const useSameAccountFieldValue = useStore(form.store, (state) => state.values[NAMES.USE_SAME_ACCOUNT]);

  return (
    <FormSection icon={Lock} title="Pull Account">
      {!useSameAccountFieldValue && (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-6">
            <PullAccountUser />
          </div>
          <div className="col-span-6">
            <PullAccountPassword />
          </div>
        </div>
      )}
    </FormSection>
  );
};
