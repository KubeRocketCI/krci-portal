import React from "react";
import { Package, Settings } from "lucide-react";
import type { CodebaseType as CodebaseTypeValue, CodebaseCreationStrategy } from "@my-project/shared";
import { useCreateCodebaseForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";

const creationMethodOptions = [
  {
    value: "template",
    label: "Select Ready Template",
    description: "Start with a pre-configured template including best practices, dependencies, and CI/CD pipelines",
    icon: Package,
  },
  {
    value: "custom",
    label: "Custom Configuration",
    description: "Configure your component manually by selecting type and creation strategy",
    icon: Settings,
  },
];

export const CreationMethod: React.FC = () => {
  const form = useCreateCodebaseForm();

  return (
    <form.AppField
      name={NAMES.ui_creationMethod}
      validators={{
        onChange: ({ value }) => (!value ? "Select creation method" : undefined),
      }}
      listeners={{
        onChange: ({ value }) => {
          form.setFieldValue(NAMES.type, "" as CodebaseTypeValue, { dontValidate: true });
          form.setFieldValue(NAMES.strategy, "" as CodebaseCreationStrategy, { dontValidate: true });
          if (value === "custom") {
            form.setFieldValue(NAMES.repositoryUrl, "", { dontValidate: true });
          }
        },
      }}
    >
      {(field) => (
        <field.FormRadioGroup
          label="Creation Method"
          options={creationMethodOptions}
          variant="vertical"
          classNames={{ item: "p-3", itemIcon: "h-6 w-6", itemIconContainer: "h-8 w-8" }}
        />
      )}
    </form.AppField>
  );
};
