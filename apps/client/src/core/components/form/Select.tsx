import React from "react";
import type {
  DeepKeys,
  DeepValue,
  FieldApi,
  FieldAsyncValidateOrFn,
  FieldValidateOrFn,
  FormAsyncValidateOrFn,
  FormValidateOrFn,
} from "@tanstack/react-form";
import {
  Select as SelectPrimitive,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/components/ui/select";
import { FormField } from "@/core/components/ui/form-field";

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
  icon?: React.ReactElement;
}

export interface SelectProps<
  Values extends Record<string, unknown> = Record<string, unknown>,
  TName extends DeepKeys<Values> = DeepKeys<Values>,
> {
  field: FieldApi<
    Values, // TParentData
    TName, // TName
    DeepValue<Values, TName>, // TData
    FieldValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined, // TOnMount
    FieldValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined, // TOnChange
    FieldAsyncValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined, // TOnChangeAsync
    FieldValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined, // TOnBlur
    FieldAsyncValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined, // TOnBlurAsync
    FieldValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined, // TOnSubmit
    FieldAsyncValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined, // TOnSubmitAsync
    FieldValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined, // TOnDynamic
    FieldAsyncValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined, // TOnDynamicAsync
    FormValidateOrFn<Values> | undefined, // TFormOnMount
    FormValidateOrFn<Values> | undefined, // TFormOnChange
    FormAsyncValidateOrFn<Values> | undefined, // TFormOnChangeAsync
    FormValidateOrFn<Values> | undefined, // TFormOnBlur
    FormAsyncValidateOrFn<Values> | undefined, // TFormOnBlurAsync
    FormValidateOrFn<Values> | undefined, // TFormOnSubmit
    FormAsyncValidateOrFn<Values> | undefined, // TFormOnSubmitAsync
    FormValidateOrFn<Values> | undefined, // TFormOnDynamic
    FormAsyncValidateOrFn<Values> | undefined, // TFormOnDynamicAsync
    FormAsyncValidateOrFn<Values> | undefined, // TFormOnServer
    never // TParentSubmitMeta
  >;
  label?: string;
  placeholder?: string;
  tooltipText?: React.ReactNode;
  disabled?: boolean;
  options: SelectOption[];
}

export const Select = <
  Values extends Record<string, unknown> = Record<string, unknown>,
  TName extends DeepKeys<Values> = DeepKeys<Values>,
>({
  field,
  label,
  placeholder,
  tooltipText,
  disabled = false,
  options,
}: SelectProps<Values, TName>) => {
  const error = field.state.meta.errors?.[0];
  const hasError = !!error;
  const errorMessage = hasError ? (error as string) : undefined;
  const fieldId = React.useId();

  const selectedOption = React.useMemo(() => {
    const value = field.state.value as string;
    return options.find((option) => option.value === value);
  }, [field.state.value, options]);

  return (
    <FormField
      label={label}
      tooltipText={tooltipText}
      error={hasError ? errorMessage : undefined}
      helperText={errorMessage}
      id={fieldId}
    >
      <SelectPrimitive
        value={(field.state.value ?? "") as string}
        onValueChange={(value) => {
          field.handleChange(value as never);
          // Trigger blur after value change
          setTimeout(() => field.handleBlur(), 0);
        }}
        disabled={disabled}
      >
        <SelectTrigger id={fieldId} aria-describedby={hasError ? `${fieldId}-helper` : undefined}>
          <div className="flex items-center gap-2">
            {selectedOption?.icon && (
              <span className="flex size-4 shrink-0 items-center justify-center">{selectedOption.icon}</span>
            )}
            <SelectValue placeholder={placeholder}>{selectedOption?.label || placeholder}</SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          {options.map(({ label: optionLabel, value, disabled: optionDisabled = false, icon }, idx) => {
            const key = `${optionLabel}::${idx}`;

            return (
              <SelectItem key={key} value={value} disabled={optionDisabled} icon={icon}>
                {optionLabel}
              </SelectItem>
            );
          })}
        </SelectContent>
      </SelectPrimitive>
    </FormField>
  );
};
