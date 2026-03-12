import { Password, URL, User } from "./fields";
import { Separator } from "@/core/components/ui/separator";
import { Globe, Shield } from "lucide-react";
import { FormSection } from "@/core/components/FormSection";

export const SecretForm = () => {
  return (
    <div className="flex flex-col gap-4">
      <FormSection icon={Globe} title="Connection Details">
        <URL />
      </FormSection>

      <Separator />

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
    </div>
  );
};
