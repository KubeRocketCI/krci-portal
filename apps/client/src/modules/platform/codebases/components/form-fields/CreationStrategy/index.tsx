import { FormRadioGroup } from "@/core/providers/Form/components/FormRadioGroup";
import { codebaseCreationStrategy } from "@my-project/shared";
import { CloudDownload, CopyPlus, FileCode } from "lucide-react";
import React from "react";
import { useFormContext } from "react-hook-form";
import { NAMES } from "../../../pages/create/components/CreateCodebaseWizard/names";

const strategyOptions = [
  {
    value: codebaseCreationStrategy.create,
    label: "Create",
    description: "Create an empty project and configure everything manually for maximum flexibility",
    icon: FileCode,
  },
  {
    value: codebaseCreationStrategy.clone,
    label: "Clone",
    description: "Clone code from third-party VCS providers",
    icon: CopyPlus,
  },
  {
    value: codebaseCreationStrategy.import,
    label: "Import",
    description: "Onboard your existing code to the KubeRocketCI platform",
    icon: CloudDownload,
  },
];

interface CreationStrategyFieldProps {
  creationMethodValue?: string;
}

export const CreationStrategyField: React.FC<CreationStrategyFieldProps> = ({ creationMethodValue }) => {
  const {
    register,
    control,
    formState: { errors },
    setValue,
  } = useFormContext();

  return (
    <FormRadioGroup
      {...register(NAMES.strategy, {
        onChange: () => {
          if (creationMethodValue === "custom") {
            setValue(NAMES.repositoryUrl, "");
          }
        },
      })}
      label="Creation Strategy"
      control={control}
      errors={errors}
      options={strategyOptions.map((option) => ({
        value: option.value,
        label: option.label,
        description: option.description,
        icon: option.icon,
      }))}
      variant="vertical"
      className="grid-cols-3"
    />
  );
};
