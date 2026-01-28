import React from "react";
import { useStore } from "@tanstack/react-form";
import z from "zod";
import { UseSpriteSymbol } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { getCodebaseMappingByType } from "@/k8s/api/groups/KRCI/Codebase";
import { CODEBASE_COMMON_LANGUAGES } from "@/k8s/api/groups/KRCI/Codebase/configs/mappings";
import type { CodebaseInterface } from "@/k8s/api/groups/KRCI/Codebase/configs/mappings/types";
import { codebaseCreationStrategy } from "@my-project/shared";
import { useCreateCodebaseForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";

export interface LangProps {
  disabled?: boolean;
  helperText?: string;
}

export const Lang: React.FC<LangProps> = ({ disabled, helperText }) => {
  const form = useCreateCodebaseForm();
  const typeFieldValue = useStore(form.store, (s) => s.values[NAMES.type]);
  const strategyFieldValue = useStore(form.store, (s) => s.values[NAMES.strategy]);

  const codebaseMapping = React.useMemo(() => {
    if (!typeFieldValue) return null;
    return getCodebaseMappingByType(typeFieldValue);
  }, [typeFieldValue]);

  const options = React.useMemo(() => {
    if (!codebaseMapping) return [];
    const result: Array<{ value: string; label: string; disabled?: boolean; icon?: React.ReactNode }> = [];
    for (const mapping of Object.values(codebaseMapping)) {
      const {
        language: { name, value, icon },
      } = mapping as CodebaseInterface;
      const isDisabled =
        value === CODEBASE_COMMON_LANGUAGES.OTHER && strategyFieldValue === codebaseCreationStrategy.create;
      result.push({
        value,
        label: name,
        disabled: isDisabled,
        icon: icon ? <UseSpriteSymbol name={icon} width={32} height={32} /> : undefined,
      });
    }
    return result;
  }, [codebaseMapping, strategyFieldValue]);

  return (
    <form.AppField
      name={NAMES.lang}
      validators={{ onChange: z.string().min(1, "Select codebase language") }}
      listeners={{
        onChange: () => {
          form.setFieldValue(NAMES.framework, "");
          form.setFieldValue(NAMES.buildTool, "");
        },
      }}
    >
      {(field) => (
        <field.FormCombobox
          label="Code language"
          tooltipText="Specify the primary programming language used in your component."
          options={options}
          placeholder="Select or enter language..."
          disabled={disabled}
          helperText={helperText}
        />
      )}
    </form.AppField>
  );
};
