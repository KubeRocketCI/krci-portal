import { FieldValues, Path, FieldErrors, Control, FieldPath, UseFormRegisterReturn } from "react-hook-form";
import { SelectOption } from "../../types";

export interface FormAutocompleteSingleProps<
  TOption extends SelectOption = SelectOption,
  TFieldValues extends FieldValues = FieldValues,
> extends Partial<UseFormRegisterReturn<Path<TFieldValues>>> {
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  options: TOption[];
  label?: string;
  tooltipText?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  TextFieldProps?: Record<string, unknown>; // Legacy prop, kept for compatibility (helperText is extracted)
  AutocompleteProps?: {
    freeSolo?: boolean;
    loading?: boolean;
    [key: string]: unknown; // Allow other props for compatibility
  };
}
