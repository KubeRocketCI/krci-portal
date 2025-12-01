import { FormRadioGroup } from "@/core/providers/Form/components/FormRadioGroup";
import { codebaseType } from "@my-project/shared";
import { CloudCog, FlaskConical, LayoutGrid, SquareLibrary } from "lucide-react";
import React from "react";
import { useFormContext } from "react-hook-form";
import { NAMES } from "../../../pages/create/components/CreateCodebaseWizard/names";

const typeOptions = [
  {
    value: codebaseType.application,
    label: "Application",
    description:
      "Deploys services and includes configuration files, deployment scripts, and other resources needed to create and manage the application's infrastructure.",
    icon: LayoutGrid,
  },
  {
    value: codebaseType.autotest,
    label: "Autotest",
    description: "Onboard and start defining Quality Gate for deployment pipelines here.",
    icon: FlaskConical,
  },
  {
    value: codebaseType.library,
    label: "Library",
    description:
      "Provides reusable code that can be incorporated into services. It includes additional functions, modules that might be shared across services.",
    icon: SquareLibrary,
  },
  {
    value: codebaseType.infrastructure,
    label: "Infrastructure",
    description:
      "Deploys and manages the infrastructure components in cloud environments using Infrastructure as Code (IaC) approach. Manage, Version and Promote your IaC environments here.",
    icon: CloudCog,
  },
];

export const CodebaseTypeField: React.FC = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <FormRadioGroup
      {...register(NAMES.type)}
      label="Codebase Type"
      control={control}
      errors={errors}
      options={typeOptions.map((option) => ({
        value: option.value,
        label: option.label,
        description: option.description,
        icon: option.icon,
      }))}
    />
  );
};
