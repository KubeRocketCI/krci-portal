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
  TextFieldProps?: Record<string, unknown>; // Legacy prop, kept for compatibility
  AutocompleteProps?: Record<string, unknown>; // Legacy prop, kept for compatibility
}
