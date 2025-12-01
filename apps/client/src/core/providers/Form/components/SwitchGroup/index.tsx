import React from "react";
import { Control, FieldErrors, FieldPath, FieldValues } from "react-hook-form";
import { FormSwitchRich } from "../FormSwitchRich";

export interface SwitchGroupItem<TFieldValues extends FieldValues = FieldValues> {
  name: FieldPath<TFieldValues>;
  label: React.ReactNode;
  helperText?: string;
  icon?: React.ReactNode;
  defaultValue?: boolean;
  disabled?: boolean;
  expandableContent?: React.ReactNode;
}

export interface SwitchGroupProps<TFieldValues extends FieldValues = FieldValues> {
  legend?: React.ReactNode;
  items: SwitchGroupItem<TFieldValues>[];
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
}

export const SwitchGroup = <TFieldValues extends FieldValues = FieldValues>({
  legend,
  items,
  control,
  errors,
}: SwitchGroupProps<TFieldValues>) => {
  return (
    <fieldset className="w-full space-y-4">
      {legend && <legend className="text-foreground text-sm leading-none font-medium">{legend}</legend>}
      <ul className="flex w-full flex-col divide-y rounded-md border">
        {items.map((item) => (
          <li key={String(item.name)}>
            <div className="p-3">
              <FormSwitchRich
                name={item.name}
                control={control}
                errors={errors}
                label={item.label}
                helperText={item.helperText}
                icon={item.icon}
                defaultValue={item.defaultValue}
                disabled={item.disabled}
                expandableContent={item.expandableContent}
                variant="list"
              />
            </div>
          </li>
        ))}
      </ul>
    </fieldset>
  );
};
