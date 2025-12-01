import { UseSpriteSymbol } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { FormCombobox } from "@/core/providers/Form/components/FormCombobox";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { codebaseCreationStrategy } from "@my-project/shared";
import React from "react";
import { useFormContext } from "react-hook-form";
import { NAMES } from "../../../pages/create/components/CreateCodebaseWizard/names";
import { CODEBASE_COMMON_LANGUAGES } from "@/k8s/api/groups/KRCI/Codebase/configs/mappings";
import { getCodebaseMappingByType } from "@/k8s/api/groups/KRCI/Codebase";
import { SelectOption } from "@/core/types/forms";
import { ComboboxOption } from "@/core/components/ui/combobox";

export const LangField: React.FC = () => {
  const {
    unregister,
    register,
    control,
    formState: { errors },
    resetField,
    watch,
  } = useFormContext();

  const typeFieldValue = watch(NAMES.type) as string;
  const strategyValue = watch(NAMES.strategy);
  const capitalizedCodebaseType = capitalizeFirstLetter(typeFieldValue);

  const createMethod = watch(NAMES.ui_creationMethod);
  const isCreateFromTemplate = createMethod === "template";

  const langOptions = React.useMemo(() => {
    const codebaseMapping = getCodebaseMappingByType(typeFieldValue);

    const resultOptions: SelectOption<string>[] = [];

    if (!codebaseMapping) {
      return resultOptions;
    }

    for (const mapping of Object.values(codebaseMapping)) {
      const {
        language: { name, value, icon },
      } = mapping;

      const isDisabled = value === CODEBASE_COMMON_LANGUAGES.OTHER && strategyValue === codebaseCreationStrategy.create;

      resultOptions.push({
        value,
        label: name,
        disabled: isDisabled,
        icon: <UseSpriteSymbol name={icon!} width={32} height={32} />,
      });
    }

    return resultOptions;
  }, [strategyValue, typeFieldValue]);

  const frameworkFieldName = NAMES.framework;
  const buildToolFieldName = NAMES.buildTool;

  const onLangChange = React.useCallback(async () => {
    resetField(frameworkFieldName);
    resetField(buildToolFieldName);
    unregister(frameworkFieldName);
  }, [resetField, unregister, frameworkFieldName, buildToolFieldName]);

  const renderOption = React.useCallback(
    (option: ComboboxOption) => {
      const optionData = langOptions.find((opt) => opt.value === option.value);
      return (
        <div className="flex items-center gap-2">
          {optionData?.icon}
          <span>{option.label}</span>
        </div>
      );
    },
    [langOptions]
  );

  return (
    <FormCombobox
      {...register(NAMES.lang, {
        onChange: onLangChange,
      })}
      control={control}
      errors={errors}
      label={`${capitalizedCodebaseType} code language`}
      tooltipText="Specify the primary programming language used in your component."
      options={langOptions}
      placeholder="Select or enter language..."
      disabled={isCreateFromTemplate}
      renderOption={renderOption}
      helperText={isCreateFromTemplate ? "Set from template" : undefined}
    />
  );
};
