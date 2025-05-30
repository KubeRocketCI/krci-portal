import { Control, FieldErrors, FieldPath, FieldValues, Path, UseFormRegisterReturn } from "react-hook-form";
import { SelectOption } from "../../types";

export interface FormSelectProps<TFieldValues extends FieldValues = FieldValues>
  extends Partial<UseFormRegisterReturn<Path<TFieldValues>>> {
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  label?: string;
  tooltipText?: React.ReactNode;
  defaultValue?: string;
  disabled?: boolean;
  options: SelectOption[];
  endAdornment?: React.ReactElement;
  helperText?: string;
}
