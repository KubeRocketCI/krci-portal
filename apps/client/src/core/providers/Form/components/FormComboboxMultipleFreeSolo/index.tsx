import React from "react";
import { Controller, Path, PathValue } from "react-hook-form";
import { ComboboxMultipleWithInput } from "@/core/components/ui/combobox-multiple-with-input";
import { FormField } from "@/core/components/ui/form-field";
import { FormComboboxMultipleFreeSoloProps } from "./types";

const FormComboboxMultipleFreeSoloInner = React.forwardRef(
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
      placeholder = "Type or select options...",
      emptyText = "No option found.",
      disabled = false,
      maxShownItems = 2,
      getChipLabel,
      renderOption,
      ...props
    }: FormComboboxMultipleFreeSoloProps<TFormValues>,
    ref: React.ForwardedRef<HTMLInputElement>
  ) => {
    const error = errors[name];
    const hasError = !!error;
    const errorMessage = error?.message as string | undefined;
    const fieldId = React.useId();

    // Convert SelectOption[] to ComboboxOption[]
    const comboboxOptions = React.useMemo(
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
              <ComboboxMultipleWithInput
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
                emptyText={emptyText}
                disabled={disabled}
                invalid={hasError}
                maxShownItems={maxShownItems}
                getChipLabel={getChipLabel}
                renderOption={renderOption}
              />
            </FormField>
          );
        }}
        {...props}
      />
    );
  }
);

FormComboboxMultipleFreeSoloInner.displayName = "FormComboboxMultipleFreeSolo";

export const FormComboboxMultipleFreeSolo = FormComboboxMultipleFreeSoloInner as <
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
>(
  props: FormComboboxMultipleFreeSoloProps<TFormValues> & { ref?: React.ForwardedRef<HTMLInputElement> }
) => React.JSX.Element;
