import type {
  DeepKeys,
  DeepValue,
  FieldApi,
  FieldAsyncValidateOrFn,
  FieldValidateOrFn,
  FormAsyncValidateOrFn,
  FormValidateOrFn,
  Updater,
} from "@tanstack/react-form";
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { FormField } from "@/core/components/ui/form-field";
import { cn } from "@/core/utils/classname";
import type { SelectOption } from "@/core/types/forms";

export interface SelectFieldProps<
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
    unknown // TParentSubmitMeta
  >;
  label?: string;
  tooltipText?: string;
  helperText?: string;
  options?: SelectOption<string>[];
  disabled?: boolean;
  placeholder?: string;
  suffix?: React.ReactNode;
}

export const SelectField = <
  Values extends Record<string, unknown> = Record<string, unknown>,
  TName extends DeepKeys<Values> = DeepKeys<Values>,
>({
  field,
  label,
  tooltipText,
  helperText,
  options = [],
  disabled = false,
  placeholder,
  suffix,
}: SelectFieldProps<Values, TName>) => {
  const error = field.state.meta.errors?.[0];
  const hasError = !!error;
  const errorMessage = hasError ? (error as string) : undefined;
  const fieldId = React.useId();

  const fieldValue = (field.state.value ?? "") as string;
  const currentOption = options.find((option) => option.value === fieldValue);
  const displayValue = currentOption ? currentOption.label : placeholder || label || "";

  return (
    <FormField
      label={label}
      tooltipText={tooltipText}
      error={hasError ? errorMessage : undefined}
      helperText={helperText}
      id={fieldId}
      suffix={suffix}
    >
      <Select
        value={fieldValue}
        onValueChange={(value) => field.handleChange(value as Updater<DeepValue<Values, TName>>)}
        disabled={disabled}
      >
        <SelectTrigger
          id={fieldId}
          className={cn("rounded border-0 shadow-none", !field.state.value && "text-muted-foreground")}
        >
          <div className="flex items-center gap-2">
            {currentOption?.icon && (
              <span className="flex size-4 shrink-0 items-center justify-center">{currentOption.icon}</span>
            )}
            <SelectValue placeholder={placeholder || label}>{displayValue}</SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          {options.map(({ label, value, disabled: optionDisabled = false, icon }, idx) => {
            const key = `${label}::${idx}`;
            return (
              <SelectItem key={key} value={value} disabled={optionDisabled} icon={icon}>
                {label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </FormField>
  );
};
