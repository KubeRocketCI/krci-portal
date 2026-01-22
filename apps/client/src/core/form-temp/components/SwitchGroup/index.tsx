import React from "react";
import { FormSwitch } from "../FormSwitch";
import { fieldContext } from "../../form-context";
import type { FieldApi } from "@tanstack/react-form";

export interface SwitchGroupItem {
  name: string;
  label: React.ReactNode;
  helperText?: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  defaultValue?: boolean;
  disabled?: boolean;
  expandableContent?: React.ReactNode;
}

// Generic interface for form with Field component
interface FormWithField {
  Field: React.ComponentType<{
    name: string;
    defaultValue?: boolean;
    children: (
      field: FieldApi<
        Record<string, unknown>,
        string,
        boolean,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        unknown
      >
    ) => React.ReactNode;
  }>;
}

export interface SwitchGroupProps<TForm extends FormWithField = FormWithField> {
  // SwitchGroup is a container component that creates multiple fields,
  // so it needs the form instance passed explicitly (not from context)
  form: TForm;
  legend?: React.ReactNode;
  items: SwitchGroupItem[];
}

export function SwitchGroup<TForm extends FormWithField>({ form, legend, items }: SwitchGroupProps<TForm>) {
  return (
    <fieldset className="w-full space-y-4">
      {legend && <legend className="text-foreground text-sm leading-none font-medium">{legend}</legend>}
      <ul className="flex w-full flex-col divide-y rounded-md border">
        {items.map((item) => (
          <li key={item.name}>
            <div className="p-3">
              <form.Field name={item.name} defaultValue={item.defaultValue}>
                {(field) => (
                  <fieldContext.Provider value={field}>
                    <FormSwitch
                      label={item.label}
                      helperText={item.helperText}
                      description={item.description}
                      icon={item.icon}
                      disabled={item.disabled}
                      expandableContent={item.expandableContent}
                      rich={true}
                      variant="list"
                    />
                  </fieldContext.Provider>
                )}
              </form.Field>
            </div>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
