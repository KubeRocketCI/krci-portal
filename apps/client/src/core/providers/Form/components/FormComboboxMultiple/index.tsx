import React from "react";
import { Controller, Path, PathValue } from "react-hook-form";
import { Combobox, ComboboxOption } from "@/core/components/ui/combobox";
import { FormField } from "@/core/components/ui/form-field";
import { FormComboboxMultipleProps } from "./types";
import { FieldEvent } from "@/core/types/forms";

const FormComboboxMultipleInner = React.forwardRef(
  <TFormValues extends Record<string, unknown> = Record<string, unknown>>(
    {
      name,
      label,
      tooltipText,
      helperText,
      control,
      defaultValue = [],
      errors,
      options = [],
      placeholder = "Select options...",
      searchPlaceholder = "Search...",
      emptyText = "No option found.",
      disabled = false,
      maxShownItems = 2,
      ...props
    }: FormComboboxMultipleProps<TFormValues>,
    ref: React.ForwardedRef<HTMLButtonElement>
  ) => {
    const error = errors[name];
    const hasError = !!error;
    const errorMessage = error?.message as string | undefined;
    const fieldId = React.useId();

    // Convert SelectOption[] to ComboboxOption[]
    const comboboxOptions: ComboboxOption[] = React.useMemo(
      () =>
        options.map((option) => ({
          value: option.value,
          label: option.label,
          disabled: option.disabled,
        })),
      [options]
    );

    return (
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue as PathValue<TFormValues, Path<TFormValues>>}
        rules={props.rules}
        render={({ field }) => {
          const fieldValue = (Array.isArray(field.value) ? field.value : []) as string[];

          const handleChange = (value: string | string[]) => {
            if (Array.isArray(value)) {
              const previousValue = fieldValue;
              field.onChange(value);
              // Call onChange from rules if provided
              if (props.rules?.onChange) {
                const event: FieldEvent<string[]> = {
                  target: {
                    name: name,
                    value: value,
                    previousValue: previousValue,
                  } as FieldEvent<string[]>["target"] & { previousValue: string[] },
                };
                props.rules.onChange(event);
              }
            }
          };

          return (
            <FormField
              label={label}
              tooltipText={tooltipText}
              error={hasError ? errorMessage : undefined}
              helperText={helperText}
              id={fieldId}
            >
              <Combobox
                ref={ref}
                id={fieldId}
                options={comboboxOptions}
                value={fieldValue}
                onValueChange={handleChange}
                placeholder={placeholder}
                searchPlaceholder={searchPlaceholder}
                emptyText={emptyText}
                disabled={disabled}
                multiple={true}
                maxShownItems={maxShownItems}
              />
            </FormField>
          );
        }}
        {...props}
      />
    );
  }
);

FormComboboxMultipleInner.displayName = "FormComboboxMultiple";

export const FormComboboxMultiple = FormComboboxMultipleInner as <
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
>(
  props: FormComboboxMultipleProps<TFormValues> & { ref?: React.ForwardedRef<HTMLButtonElement> }
) => React.JSX.Element;
