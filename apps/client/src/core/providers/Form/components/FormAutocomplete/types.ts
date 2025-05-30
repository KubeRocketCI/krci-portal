import { StandardTextFieldProps, AutocompleteProps } from "@mui/material";
import { Control, FieldErrors, FieldPath, PathValue } from "react-hook-form";
import { SelectOption } from "../../types";

export interface FormAutocompleteMultiProps<
  TOption extends SelectOption = SelectOption,
  TFieldValues extends Record<string, unknown> = Record<string, unknown>,
> {
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  options: TOption[];
  label?: string;
  tooltipText?: string;
  placeholder?: string;
  defaultValue?: PathValue<TFieldValues, FieldPath<TFieldValues>>;
  disabled?: boolean;
  TextFieldProps?: StandardTextFieldProps;
  AutocompleteProps?: AutocompleteProps<TOption, true, false, false>;
}
