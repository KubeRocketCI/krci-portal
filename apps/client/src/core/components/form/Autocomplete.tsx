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
import { Combobox, ComboboxOption } from "@/core/components/ui/combobox";
import { FormField } from "@/core/components/ui/form-field";

export interface AutocompleteProps<
  Values extends Record<string, unknown> = Record<string, unknown>,
  TName extends DeepKeys<Values> = DeepKeys<Values>,
  TOption = string,
  Multiple extends boolean = false,
  DisableClearable extends boolean = false,
  FreeSolo extends boolean = false,
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
  helperText?: string;
  options: TOption[];
  multiple?: Multiple;
  freeSolo?: FreeSolo;
  disableClearable?: DisableClearable;
  getOptionLabel?: (option: TOption | string) => string;
  // Legacy props - kept for backward compatibility but not used
  ChipProps?: Record<string, unknown>;
}

export const Autocomplete = <
  Values extends Record<string, unknown> = Record<string, unknown>,
  TName extends DeepKeys<Values> = DeepKeys<Values>,
  TOption = string,
  Multiple extends boolean = false,
  DisableClearable extends boolean = false,
  FreeSolo extends boolean = false,
>({
  field,
  label,
  placeholder,
  tooltipText,
  disabled = false,
  helperText,
  options,
  multiple,
  getOptionLabel,
}: AutocompleteProps<Values, TName, TOption, Multiple, DisableClearable, FreeSolo>) => {
  const error = field.state.meta.errors?.[0];
  const hasError = !!error;
  const errorMessage = hasError ? (error as string) : undefined;
  const fieldId = React.useId();

  // Convert options to ComboboxOption format
  const comboboxOptions: ComboboxOption[] = React.useMemo(() => {
    return options.map((option) => {
      const label = getOptionLabel ? getOptionLabel(option) : String(option);
      const value = typeof option === "string" ? option : String(option);
      return { label, value };
    });
  }, [options, getOptionLabel]);

  // Handle value conversion
  const comboboxValue = React.useMemo(() => {
    const fieldValue = field.state.value;
    if (multiple) {
      return Array.isArray(fieldValue) ? fieldValue.map((v) => String(v)) : [];
    }
    return fieldValue ? String(fieldValue) : "";
  }, [field.state.value, multiple]);

  const handleValueChange = React.useCallback(
    (value: string | string[]) => {
      if (multiple) {
        field.handleChange((Array.isArray(value) ? value : [value]) as never);
      } else {
        field.handleChange((value as string) as never);
      }
    },
    [field, multiple]
  );

  // Note: freeSolo and disableClearable are not directly supported by Combobox
  // These would need to be handled at a higher level if needed

  return (
    <FormField
      label={label}
      tooltipText={tooltipText}
      error={hasError ? errorMessage : undefined}
      helperText={errorMessage || helperText}
      id={fieldId}
    >
      <Combobox
        options={comboboxOptions}
        value={comboboxValue}
        onValueChange={handleValueChange}
        placeholder={placeholder}
        multiple={multiple}
        disabled={disabled}
        id={fieldId}
        aria-describedby={hasError ? `${fieldId}-helper` : undefined}
      />
    </FormField>
  );
};
