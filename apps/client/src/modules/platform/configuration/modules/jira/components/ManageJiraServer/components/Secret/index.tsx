import { Password, User } from "./fields";
import { Shield } from "lucide-react";
import { FormSection } from "@/core/components/FormSection";

export const SecretForm = () => {
  return (
    <FormSection icon={Shield} title="Authentication">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-6">
          <User />
        </div>
        <div className="col-span-6">
          <Password />
        </div>
      </div>
    </FormSection>
  );
};
