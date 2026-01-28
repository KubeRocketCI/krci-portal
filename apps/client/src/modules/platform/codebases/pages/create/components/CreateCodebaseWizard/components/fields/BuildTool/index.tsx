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

export interface BuildToolProps {
  disabled?: boolean;
  helperText?: string;
}

export const BuildTool: React.FC<BuildToolProps> = ({ disabled, helperText }) => {
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
    for (const buildTool of Object.values<CodebaseMappingItemInterface>(codebaseMappingByLang.buildTools)) {
      const { name, value, icon } = buildTool;
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
        name={NAMES.buildTool}
        validators={{
          onChange: z
            .string()
            .min(1, "Select or enter build tool")
            .max(8, "You exceeded the maximum length of 8")
            .regex(/[a-z]/, "Invalid build tool name: [a-z]"),
        }}
      >
        {(field) => (
          <field.FormTextField
            label="Build tool"
            tooltipText="Choose the build tool your project uses. This information is crucial for accurate build pipeline configuration."
            placeholder="Enter build tool"
            disabled={disabled || !langFieldValue}
            helperText={helperText}
          />
        )}
      </form.AppField>
    );
  }

  return (
    <form.AppField name={NAMES.buildTool} validators={{ onChange: z.string().min(1, "Select or enter build tool") }}>
      {(field) => (
        <field.FormCombobox
          label="Build tool"
          tooltipText="Choose the build tool your project uses. This information is crucial for accurate build pipeline configuration."
          options={options}
          placeholder="Select or enter build tool..."
          disabled={disabled || !langFieldValue}
          helperText={helperText}
        />
      )}
    </form.AppField>
  );
};
