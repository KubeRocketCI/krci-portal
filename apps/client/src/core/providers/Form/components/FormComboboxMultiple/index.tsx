import React from "react";
import { Controller, Path, PathValue } from "react-hook-form";
import { Combobox, ComboboxOption } from "@/core/components/ui/combobox";
import { FormField } from "@/core/components/ui/form-field";
import { FormComboboxMultipleProps } from "./types";

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
        render={({ field }) => {
          const fieldValue = (Array.isArray(field.value) ? field.value : []) as string[];

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
                onValueChange={(value) => {
                  if (Array.isArray(value)) {
                    field.onChange(value);
                  }
                }}
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

