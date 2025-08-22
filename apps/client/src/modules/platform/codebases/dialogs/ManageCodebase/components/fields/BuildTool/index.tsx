import { UseSpriteSymbol } from "@/k8s/icons/UseSpriteSymbol";
import { FormRadioGroup } from "@/core/providers/Form/components/FormRadioGroup";
import { FormRadioOption } from "@/core/providers/Form/components/FormRadioGroup/types";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import React from "react";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { CODEBASE_FORM_NAMES } from "../../../names";
import { getCodebaseMappingByType } from "@/k8s/api/groups/KRCI/Codebase";
import { CODEBASE_COMMON_LANGUAGES } from "@/k8s/api/groups/KRCI/Codebase/configs/mappings";
import { CodebaseInterface, CodebaseMappingItemInterface } from "@/k8s/api/groups/KRCI/Codebase/configs/mappings/types";

export const BuildTool = () => {
  const {
    register,
    control,
    formState: { errors },
    watch,
  } = useTypedFormContext();

  const langFieldValue: string = watch(CODEBASE_FORM_NAMES.lang.name);
  const typeFieldValue: string = watch(CODEBASE_FORM_NAMES.type.name);

  const codebaseMapping = getCodebaseMappingByType(typeFieldValue) as Record<string, CodebaseInterface>;
  const lang = langFieldValue.toLowerCase();

  const codebaseMappingByLang = codebaseMapping?.[lang];

  const buildToolOptions = React.useMemo(() => {
    if (!codebaseMappingByLang) {
      return [];
    }

    const resultOptions: FormRadioOption[] = [];

    for (const buildTool of Object.values<CodebaseMappingItemInterface>(codebaseMappingByLang.buildTools)) {
      const { name, value, icon } = buildTool;
      resultOptions.push({
        value,
        label: name,
        icon: <UseSpriteSymbol name={icon!} width={20} height={20} />,
        checkedIcon: <UseSpriteSymbol name={icon!} width={20} height={20} />,
      });
    }

    return resultOptions;
  }, [codebaseMappingByLang]);

  return (
    <>
      {langFieldValue === CODEBASE_COMMON_LANGUAGES.OTHER ? (
        <FormTextField
          {...register(CODEBASE_FORM_NAMES.buildTool.name, {
            required: `Enter ${typeFieldValue} build tool.`,
            maxLength: {
              value: 8,
              message: "You exceeded the maximum length of 8",
            },
            pattern: {
              value: /[a-z]/,
              message: "Invalid build tool name: [a-z]",
            },
          })}
          label={"Build tool"}
          tooltipText={
            "Choose the build tool your project uses. This information is crucial for accurate build pipeline configuration."
          }
          placeholder={`Enter build tool`}
          control={control}
          errors={errors}
        />
      ) : (
        <FormRadioGroup
          {...register(CODEBASE_FORM_NAMES.buildTool.name, {
            required: `Select ${typeFieldValue} build tool.`,
          })}
          control={control}
          errors={errors}
          label={"Build tool"}
          tooltipText={
            "Choose the build tool your project uses. This information is crucial for accurate build pipeline configuration."
          }
          options={buildToolOptions}
        />
      )}
    </>
  );
};
