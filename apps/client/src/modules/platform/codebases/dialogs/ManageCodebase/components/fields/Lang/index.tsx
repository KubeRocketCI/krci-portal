import { UseSpriteSymbol } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { FormRadioGroup } from "@/core/providers/Form/components/FormRadioGroup";
import { FormRadioOption } from "@/core/providers/Form/components/FormRadioGroup/types";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { codebaseCreationStrategy } from "@my-project/shared";
import React from "react";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { CODEBASE_FORM_NAMES } from "../../../names";
import { CODEBASE_COMMON_LANGUAGES } from "@/k8s/api/groups/KRCI/Codebase/configs/mappings";
import { getCodebaseMappingByType } from "@/k8s/api/groups/KRCI/Codebase";

export const Lang = () => {
  const {
    unregister,
    register,
    control,
    formState: { errors },
    resetField,
    watch,
  } = useTypedFormContext();

  const typeFieldValue = watch(CODEBASE_FORM_NAMES.type.name) as string;
  const strategyValue = watch(CODEBASE_FORM_NAMES.strategy.name);
  const capitalizedCodebaseType = capitalizeFirstLetter(typeFieldValue);

  const langOptions = React.useMemo(() => {
    const codebaseMapping = getCodebaseMappingByType(typeFieldValue);

    const resultOptions: FormRadioOption[] = [];

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
        icon: <UseSpriteSymbol name={icon!} width={16} height={16} />,
        checkedIcon: <UseSpriteSymbol name={icon!} width={16} height={16} />,
        disabled: isDisabled,
        disabledTooltip: isDisabled
          ? "Choose this option if your desired programming language is not listed. This option is available exclusively when using the Clone and Import strategy."
          : undefined,
      });
    }

    return resultOptions;
  }, [strategyValue, typeFieldValue]);

  const onLangChange = React.useCallback(async () => {
    resetField(CODEBASE_FORM_NAMES.framework.name);
    resetField(CODEBASE_FORM_NAMES.buildTool.name);
    unregister(CODEBASE_FORM_NAMES.framework.name);
  }, [resetField, unregister]);

  return (
    <FormRadioGroup
      {...register(CODEBASE_FORM_NAMES.lang.name, {
        required: `Select codebase language`,
        onChange: onLangChange,
      })}
      control={control}
      errors={errors}
      label={`${capitalizedCodebaseType} code language`}
      tooltipText={"Specify the primary programming language used in your component."}
      options={langOptions}
      className="grid-cols-6"
    />
  );
};
