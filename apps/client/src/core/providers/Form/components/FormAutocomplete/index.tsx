import { SelectOption } from "@/core/providers/Form/types";
import { FormComboboxMultiple } from "@/core/providers/Form/components/FormComboboxMultiple";
import { FieldValues } from "react-hook-form";
import { FormAutocompleteMultiProps } from "./types";

const FormAutocompleteMultiInner = <
  TOption extends SelectOption = SelectOption,
  TFieldValues extends FieldValues = FieldValues,
>({
  name,
  control,
  errors,
  label,
  tooltipText,
  options,
  placeholder,
  defaultValue,
  disabled = false,
  TextFieldProps = {},
  ...props
}: FormAutocompleteMultiProps<TOption, TFieldValues>) => {
  // Map TextFieldProps.helperText to helperText
  const helperText = TextFieldProps?.helperText as string | undefined;

  return (
    <FormComboboxMultiple
      name={name}
      control={control}
      errors={errors}
      label={label}
      tooltipText={tooltipText}
      helperText={helperText}
      placeholder={placeholder}
      disabled={disabled}
      options={options}
      defaultValue={defaultValue as string[]}
      maxShownItems={5}
      {...props}
    />
  );
};

FormAutocompleteMultiInner.displayName = "FormAutocompleteMulti";

export const FormAutocompleteMulti = FormAutocompleteMultiInner;
