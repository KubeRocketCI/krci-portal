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
import { Input } from "@/core/components/ui/input";
import { FormField } from "@/core/components/ui/form-field";

export interface TextFieldProps<
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
}

export const TextField = <
  Values extends Record<string, unknown> = Record<string, unknown>,
  TName extends DeepKeys<Values> = DeepKeys<Values>,
>({
  field,
  label,
  placeholder,
  tooltipText,
  disabled = false,
}: TextFieldProps<Values, TName>) => {
  const error = field.state.meta.errors?.[0];
  const hasError = !!error;
  const errorMessage = hasError ? (error as string) : undefined;
  const fieldId = React.useId();

  return (
    <FormField
      label={label}
      tooltipText={tooltipText}
      error={hasError ? errorMessage : undefined}
      helperText={errorMessage}
      id={fieldId}
    >
      <Input
        value={(field.state.value ?? "") as string}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          field.handleChange(e.target.value as Updater<DeepValue<Values, TName>>)
        }
        onBlur={field.handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        invalid={hasError}
        id={fieldId}
        aria-describedby={hasError ? `${fieldId}-helper` : undefined}
      />
    </FormField>
  );
};
