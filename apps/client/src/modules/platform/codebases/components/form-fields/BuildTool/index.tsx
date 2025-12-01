import { UseSpriteSymbol } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { FormCombobox } from "@/core/providers/Form/components/FormCombobox";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import React from "react";
import { useFormContext } from "react-hook-form";
import { NAMES } from "../../../pages/create/components/CreateCodebaseWizard/names";
import { getCodebaseMappingByType } from "@/k8s/api/groups/KRCI/Codebase";
import { CODEBASE_COMMON_LANGUAGES } from "@/k8s/api/groups/KRCI/Codebase/configs/mappings";
import { CodebaseInterface, CodebaseMappingItemInterface } from "@/k8s/api/groups/KRCI/Codebase/configs/mappings/types";
import { SelectOption } from "@/core/types/forms";
import { ComboboxOption } from "@/core/components/ui/combobox";

export const BuildToolField: React.FC = () => {
  const {
    register,
    control,
    formState: { errors },
    watch,
  } = useFormContext();

  const langFieldValue: string = watch(NAMES.lang);
  const typeFieldValue: string = watch(NAMES.type);
  const createMethod = watch(NAMES.ui_creationMethod);
  const isCreateFromTemplate = createMethod === "template";
  const isOtherLanguage = langFieldValue === CODEBASE_COMMON_LANGUAGES.OTHER;

  const codebaseMapping = getCodebaseMappingByType(typeFieldValue) as Record<string, CodebaseInterface>;
  const lang = langFieldValue?.toLowerCase();
  const codebaseMappingByLang = codebaseMapping?.[lang];

  const buildToolOptions = React.useMemo(() => {
    if (!codebaseMappingByLang) {
      return [];
    }

    const resultOptions: SelectOption<string>[] = [];

    for (const buildTool of Object.values<CodebaseMappingItemInterface>(codebaseMappingByLang.buildTools)) {
      const { name, value, icon } = buildTool;
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
      const optionData = buildToolOptions.find((opt) => opt.value === option.value);
      return (
        <div className="flex items-center gap-2">
          {optionData?.icon}
          <span>{option.label}</span>
        </div>
      );
    },
    [buildToolOptions]
  );

  // Common props shared between FormTextField and FormCombobox
  const commonProps = {
    control,
    errors,
    label: "Build tool",
    tooltipText:
      "Choose the build tool your project uses. This information is crucial for accurate build pipeline configuration.",
    helperText: isCreateFromTemplate ? "Set from template" : undefined,
    disabled: isCreateFromTemplate || !langFieldValue,
  };

  return (
    <>
      {isOtherLanguage ? (
        <FormTextField
          {...register(NAMES.buildTool, {
            maxLength: {
              value: 8,
              message: "You exceeded the maximum length of 8",
            },
            pattern: {
              value: /[a-z]/,
              message: "Invalid build tool name: [a-z]",
            },
          })}
          {...commonProps}
          placeholder="Enter build tool"
        />
      ) : (
        <FormCombobox
          {...register(NAMES.buildTool)}
          {...commonProps}
          options={buildToolOptions}
          placeholder="Select or enter build tool..."
          renderOption={renderOption}
        />
      )}
    </>
  );
};
