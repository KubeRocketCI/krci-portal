import { FormRadioGroup } from "@/core/providers/Form/components/FormRadioGroup";
import { FieldEvent } from "@/core/types/forms";
import { CodebaseCreationStrategy, CodebaseType } from "@my-project/shared";
import { Package, Settings } from "lucide-react";
import React from "react";
import { useFormContext } from "react-hook-form";
import { NAMES } from "../../../pages/create/components/CreateCodebaseWizard/names";

const creationMethodOptions = [
  {
    value: "template",
    label: "Select Ready Template",
    description: "Start with a pre-configured template including best practices, dependencies, and CI/CD pipelines",
    icon: Package,
  },
  {
    value: "custom",
    label: "Custom Configuration",
    description: "Configure your component manually by selecting type and creation strategy",
    icon: Settings,
  },
];

export const CreationMethodField: React.FC = () => {
  const {
    register,
    control,
    formState: { errors },
    setValue,
  } = useFormContext();

  return (
    <FormRadioGroup
      {...register(NAMES.ui_creationMethod, {
        onChange: (event: FieldEvent<string>) => {
          const value = event.target.value;
          if (value === "template") {
            setValue(NAMES.type, "" as CodebaseType);
            setValue(NAMES.strategy, "" as CodebaseCreationStrategy);
          } else if (value === "custom") {
            setValue(NAMES.repositoryUrl, "");
          }
        },
      })}
      label="Creation Method"
      control={control}
      errors={errors}
      options={creationMethodOptions.map((option) => ({
        value: option.value,
        label: option.label,
        description: option.description,
        icon: option.icon,
      }))}
      variant="vertical"
    />
  );
};
