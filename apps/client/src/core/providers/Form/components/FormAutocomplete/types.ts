import { StandardTextFieldProps, AutocompleteProps } from "@mui/material";
import { Control, FieldErrors, FieldPath, FieldValues, Path, PathValue, UseFormRegisterReturn } from "react-hook-form";
import { SelectOption } from "../../types";

export interface FormAutocompleteMultiProps<
  TOption extends SelectOption = SelectOption,
  TFieldValues extends FieldValues = FieldValues,
> extends Partial<UseFormRegisterReturn<Path<TFieldValues>>> {
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
