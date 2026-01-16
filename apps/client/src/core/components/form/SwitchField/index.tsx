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
import { Switch } from "@/core/components/ui/switch";

export interface SwitchFieldProps<
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
  disabled?: boolean;
}

export const SwitchField = <
  Values extends Record<string, unknown> = Record<string, unknown>,
  TName extends DeepKeys<Values> = DeepKeys<Values>,
>({
  field,
  disabled = false,
}: SwitchFieldProps<Values, TName>) => {
  const fieldId = React.useId();
  const hasError = field.state.meta.errors.length > 0;

  return (
    <Switch
      name={field.name}
      checked={!!field.state.value}
      onCheckedChange={(checked: boolean) => {
        field.handleChange(checked as Updater<DeepValue<Values, TName>>);
      }}
      onBlur={field.handleBlur}
      disabled={disabled}
      id={fieldId}
      invalid={hasError}
    />
  );
};
