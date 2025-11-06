import React from "react";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { CODEBASE_FORM_NAMES } from "../../../names";
import { UseSpriteSymbol } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { FormRadioGroup } from "@/core/providers/Form/components/FormRadioGroup";
import { FormRadioOption } from "@/core/providers/Form/components/FormRadioGroup/types";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { getCodebaseMappingByType } from "@/k8s/api/groups/KRCI/Codebase";
import { CODEBASE_COMMON_LANGUAGES } from "@/k8s/api/groups/KRCI/Codebase/configs/mappings";
import { CodebaseInterface, CodebaseMappingItemInterface } from "@/k8s/api/groups/KRCI/Codebase/configs/mappings/types";

export const Framework = () => {
  const {
    register,
    control,
    formState: { errors },
    watch,
  } = useTypedFormContext();

  const langFieldValue = watch(CODEBASE_FORM_NAMES.lang.name) as string;
  const typeFieldValue = watch(CODEBASE_FORM_NAMES.type.name) as string;

  const codebaseMapping = getCodebaseMappingByType(typeFieldValue) as Record<string, CodebaseInterface>;
  const lang = langFieldValue.toLowerCase();

  const codebaseMappingByLang = codebaseMapping?.[lang];

  const frameworkOptions = React.useMemo(() => {
    if (!codebaseMappingByLang) {
      return [];
    }

    const resultOptions: FormRadioOption[] = [];

    for (const framework of Object.values<CodebaseMappingItemInterface>(codebaseMappingByLang.frameworks)) {
      const { name, value, icon } = framework;
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
          {...register(CODEBASE_FORM_NAMES.framework.name, {
            required: `Enter ${typeFieldValue} language version/framework`,
            maxLength: {
              value: 8,
              message: "You exceeded the maximum length of 8",
            },
            pattern: {
              value: /[a-z]/,
              message: "Invalid language version/framework name: [a-z]",
            },
          })}
          label={`Language version/framework`}
          tooltipText={"Indicate the version of the programming language or framework your component relies on. "}
          placeholder={`Enter language version/framework`}
          control={control}
          errors={errors}
        />
      ) : (
        <FormRadioGroup
          {...register(CODEBASE_FORM_NAMES.framework.name, {
            required: `Select ${typeFieldValue} language version/framework`,
          })}
          control={control}
          errors={errors}
          label={`Language version/framework`}
          tooltipText={"Indicate the version of the programming language or framework your component relies on. "}
          options={frameworkOptions}
          className="grid-cols-6"
        />
      )}
    </>
  );
};
