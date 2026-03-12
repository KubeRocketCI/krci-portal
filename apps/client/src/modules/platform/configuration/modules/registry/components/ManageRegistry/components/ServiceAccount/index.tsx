import { IrsaRoleArn } from "./fields";
import { Shield } from "lucide-react";
import { FormSection } from "@/core/components/FormSection";

export const ServiceAccountForm = () => {
  return (
    <FormSection icon={Shield} title="Authentication">
      <IrsaRoleArn />
    </FormSection>
  );
};
