import { SelectOption } from "@/core/providers/Form/types";
import { FormCombobox } from "@/core/providers/Form/components/FormCombobox";
import { FormAutocompleteSingleProps } from "./types";
import React from "react";

const FormAutocompleteSingleInner = React.forwardRef(
  <TOption extends SelectOption = SelectOption, TFormValues extends Record<string, unknown> = Record<string, unknown>>(
    {
      name,
      label,
      tooltipText,
      control,
      defaultValue,
      errors,
      placeholder,
      disabled = false,
      options,
      TextFieldProps = {},
      AutocompleteProps,
      ...props
    }: FormAutocompleteSingleProps<TOption, TFormValues>
    // _ref: React.ForwardedRef<HTMLInputElement>
  ) => {
    // Map TextFieldProps.helperText to helperText
    const helperText = TextFieldProps?.helperText as string | undefined;

    return (
      <FormCombobox
        name={name}
        control={control}
        errors={errors}
        label={label}
        tooltipText={tooltipText}
        helperText={helperText}
        placeholder={placeholder}
        disabled={disabled}
        options={options}
        defaultValue={defaultValue}
        freeSolo={AutocompleteProps?.freeSolo}
        loading={AutocompleteProps?.loading}
        {...props}
      />
    );
  }
);

FormAutocompleteSingleInner.displayName = "FormAutocompleteSingle";

export const FormAutocompleteSingle = FormAutocompleteSingleInner as <
  TOption extends SelectOption = SelectOption,
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
>(
  props: FormAutocompleteSingleProps<TOption, TFormValues> & {
    ref?: React.ForwardedRef<HTMLInputElement>;
  }
) => React.JSX.Element;
