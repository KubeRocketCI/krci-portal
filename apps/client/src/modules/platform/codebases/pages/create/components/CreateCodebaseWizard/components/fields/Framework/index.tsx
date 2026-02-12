import React from "react";
import { useStore } from "@tanstack/react-form";
import z from "zod";
import { UseSpriteSymbol } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { getCodebaseMappingByType } from "@/k8s/api/groups/KRCI/Codebase";
import { CODEBASE_COMMON_LANGUAGES } from "@/k8s/api/groups/KRCI/Codebase/configs/mappings";
import type {
  CodebaseInterface,
  CodebaseMappingItemInterface,
} from "@/k8s/api/groups/KRCI/Codebase/configs/mappings/types";
import { useCreateCodebaseForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";

export interface FrameworkProps {
  disabled?: boolean;
  helperText?: string;
}

export const Framework: React.FC<FrameworkProps> = ({ disabled, helperText }) => {
  const form = useCreateCodebaseForm();
  const typeFieldValue = useStore(form.store, (s) => s.values[NAMES.type]);
  const langFieldValue = useStore(form.store, (s) => s.values[NAMES.lang]);

  const codebaseMapping = React.useMemo(() => {
    if (!typeFieldValue) return null;
    return getCodebaseMappingByType(typeFieldValue);
  }, [typeFieldValue]);

  const lang = langFieldValue?.toLowerCase();
  const codebaseMappingByLang = React.useMemo(() => {
    if (!codebaseMapping || !lang) return null;
    return (codebaseMapping as Record<string, CodebaseInterface>)[lang];
  }, [codebaseMapping, lang]);

  const isOtherLanguage = langFieldValue === CODEBASE_COMMON_LANGUAGES.OTHER;

  const options = React.useMemo(() => {
    if (!codebaseMappingByLang) return [];
    const result: Array<{ value: string; label: string; icon?: React.ReactNode }> = [];
    for (const framework of Object.values<CodebaseMappingItemInterface>(codebaseMappingByLang.frameworks)) {
      const { name, value, icon } = framework;
      result.push({
        value,
        label: name,
        icon: icon ? <UseSpriteSymbol name={icon} width={32} height={32} /> : undefined,
      });
    }
    return result;
  }, [codebaseMappingByLang]);

  if (isOtherLanguage) {
    return (
      <form.AppField
        name={NAMES.framework}
        validators={{
          onChange: z
            .string()
            .min(1, "Select or enter language version/framework")
            .max(8, "You exceeded the maximum length of 8")
            .regex(/[a-z]/, "Invalid language version/framework name: [a-z]"),
        }}
      >
        {(field) => (
          <field.FormTextField
            label="Language version/framework"
            tooltipText="Indicate the version of the programming language or framework your project relies on."
            placeholder="Enter framework"
            disabled={disabled || !langFieldValue}
            helperText={helperText}
          />
        )}
      </form.AppField>
    );
  }

  return (
    <form.AppField
      name={NAMES.framework}
      validators={{ onChange: z.string().min(1, "Select or enter language version/framework") }}
    >
      {(field) => (
        <field.FormCombobox
          label="Language version/framework"
          tooltipText="Indicate the version of the programming language or framework your project relies on."
          options={options}
          placeholder="Select or enter framework..."
          disabled={disabled || !langFieldValue}
          helperText={helperText}
        />
      )}
    </form.AppField>
  );
};
