import React from "react";
import { useFormContext } from "react-hook-form";
import { NAMES } from "../../../pages/create/components/CreateCodebaseWizard/names";
import { UseSpriteSymbol } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { FormCombobox } from "@/core/providers/Form/components/FormCombobox";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { getCodebaseMappingByType } from "@/k8s/api/groups/KRCI/Codebase";
import { CODEBASE_COMMON_LANGUAGES } from "@/k8s/api/groups/KRCI/Codebase/configs/mappings";
import { CodebaseInterface, CodebaseMappingItemInterface } from "@/k8s/api/groups/KRCI/Codebase/configs/mappings/types";
import { SelectOption } from "@/core/types/forms";
import { ComboboxOption } from "@/core/components/ui/combobox";

export const FrameworkField: React.FC = () => {
  const {
    register,
    control,
    formState: { errors },
    watch,
  } = useFormContext();

  const langFieldValue = watch(NAMES.lang) as string;
  const typeFieldValue = watch(NAMES.type) as string;
  const createMethod = watch(NAMES.ui_creationMethod);
  const isCreateFromTemplate = createMethod === "template";
  const isOtherLanguage = langFieldValue === CODEBASE_COMMON_LANGUAGES.OTHER;

  const codebaseMapping = getCodebaseMappingByType(typeFieldValue) as Record<string, CodebaseInterface>;
  const lang = langFieldValue?.toLowerCase();
  const codebaseMappingByLang = codebaseMapping?.[lang];

  const frameworkOptions = React.useMemo(() => {
    if (!codebaseMappingByLang) {
      return [];
    }

    const resultOptions: SelectOption<string>[] = [];

    for (const framework of Object.values<CodebaseMappingItemInterface>(codebaseMappingByLang.frameworks)) {
      const { name, value, icon } = framework;
      resultOptions.push({
        value,
        label: name,
        icon: <UseSpriteSymbol name={icon!} width={32} height={32} />,
      });
    }

    return resultOptions;
  }, [codebaseMappingByLang]);

  const renderOption = React.useCallback(
    (option: ComboboxOption) => {
      const optionData = frameworkOptions.find((opt) => opt.value === option.value);
      return (
        <div className="flex items-center gap-2">
          {optionData?.icon}
          <span>{option.label}</span>
        </div>
      );
    },
    [frameworkOptions]
  );

  // Common props shared between FormTextField and FormCombobox
  const commonProps = {
    control,
    errors,
    label: "Language version/framework",
    tooltipText: "Indicate the version of the programming language or framework your component relies on.",
    helperText: isCreateFromTemplate ? "Set from template" : undefined,
    disabled: isCreateFromTemplate || !langFieldValue,
  };

  return (
    <>
      {isOtherLanguage ? (
        <FormTextField
          {...register(NAMES.framework, {
            maxLength: {
              value: 8,
              message: "You exceeded the maximum length of 8",
            },
            pattern: {
              value: /[a-z]/,
              message: "Invalid language version/framework name: [a-z]",
            },
          })}
          {...commonProps}
          placeholder="Enter framework"
        />
      ) : (
        <FormCombobox
          {...register(NAMES.framework)}
          {...commonProps}
          options={frameworkOptions}
          placeholder="Select or enter framework..."
          renderOption={renderOption}
        />
      )}
    </>
  );
};
