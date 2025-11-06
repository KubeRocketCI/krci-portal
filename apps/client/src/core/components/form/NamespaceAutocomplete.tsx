import type {
  DeepKeys,
  DeepValue,
  FieldApi,
  FieldAsyncValidateOrFn,
  FieldValidateOrFn,
  FormAsyncValidateOrFn,
  FormValidateOrFn,
} from "@tanstack/react-form";
import React from "react";
import { Combobox, ComboboxOption } from "@/core/components/ui/combobox";
import { FormField } from "@/core/components/ui/form-field";

export interface NamespaceAutocompleteProps<
  Values extends Record<string, unknown> = Record<string, unknown>,
  TName extends DeepKeys<Values> = DeepKeys<Values>,
> {
  field: FieldApi<
    Values,
    TName,
    DeepValue<Values, TName>,
    FieldValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined,
    FieldValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined,
    FieldAsyncValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined,
    FieldValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined,
    FieldAsyncValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined,
    FieldValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined,
    FieldAsyncValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined,
    FieldValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined,
    FieldAsyncValidateOrFn<Values, TName, DeepValue<Values, TName>> | undefined,
    FormValidateOrFn<Values> | undefined,
    FormValidateOrFn<Values> | undefined,
    FormAsyncValidateOrFn<Values> | undefined,
    FormValidateOrFn<Values> | undefined,
    FormAsyncValidateOrFn<Values> | undefined,
    FormValidateOrFn<Values> | undefined,
    FormAsyncValidateOrFn<Values> | undefined,
    FormValidateOrFn<Values> | undefined,
    FormAsyncValidateOrFn<Values> | undefined,
    FormAsyncValidateOrFn<Values> | undefined,
    never
  >;
  label?: string;
  placeholder?: string;
  options: string[];
}

export const NamespaceAutocomplete = <
  Values extends Record<string, unknown> = Record<string, unknown>,
  TName extends DeepKeys<Values> = DeepKeys<Values>,
>({
  field,
  label,
  placeholder,
  options,
}: NamespaceAutocompleteProps<Values, TName>) => {
  const value = (field.state.value as string[]) ?? [];
  const error = field.state.meta.errors?.[0];
  const hasError = !!error;
  const errorText = hasError ? (error as string) : undefined;

  // Convert string array to ComboboxOption array
  const comboboxOptions: ComboboxOption[] = React.useMemo(
    () => options.map((option) => ({ value: option, label: option })),
    [options]
  );

  return (
    <FormField label={label} error={errorText} id={`namespace-autocomplete-${field.name}`}>
      <Combobox
        options={comboboxOptions}
        value={value}
        onValueChange={(newValue) => {
          if (Array.isArray(newValue)) {
            field.handleChange(newValue as never);
          }
        }}
        placeholder={value.length === 0 ? placeholder : undefined}
        multiple={true}
        maxShownItems={1}
      />
    </FormField>
  );
};
