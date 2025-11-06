import { Control, FieldErrors, FieldPath, FieldValues, Path, UseFormRegisterReturn } from "react-hook-form";

export interface FormSwitchProps<TFieldValues extends FieldValues = FieldValues>
  extends Partial<UseFormRegisterReturn<Path<TFieldValues>>> {
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  defaultValue?: boolean;
  disabled?: boolean;
}

