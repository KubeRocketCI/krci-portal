import { useStore } from "@tanstack/react-form";
import { containerRegistryType } from "@my-project/shared";
import { IrsaRoleArn } from "../fields";
import { Shield } from "lucide-react";
import { FormSection } from "@/core/components/FormSection";
import { useEditRegistryForm } from "../../providers/form/hooks";
import { NAMES } from "../../constants";

export const ServiceAccountForm = () => {
  const form = useEditRegistryForm();

  const registryTypeFieldValue = useStore(form.store, (state) => state.values[NAMES.REGISTRY_TYPE]);

  // IRSA Role ARN is only relevant for ECR
  if (registryTypeFieldValue !== containerRegistryType.ecr) {
    return null;
  }

  return (
    <FormSection icon={Shield} title="Authentication">
      <IrsaRoleArn />
    </FormSection>
  );
};
