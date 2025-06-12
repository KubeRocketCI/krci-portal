import { Control, FieldErrors, FieldPath, FieldValues } from "react-hook-form";
import { ReactNode } from "react";

export interface FormRadioOption {
  value: string;
  label: ReactNode;
  icon?: ReactNode;
  checkedIcon?: ReactNode;
  disabled?: boolean;
  disabledTooltip?: string;
}

export interface FormRadioGroupProps<TFieldValues extends FieldValues = FieldValues> {
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  label: ReactNode;
  tooltipText?: string;
  options: FormRadioOption[];
  disabled?: boolean;
  defaultValue?: string;
  helperText?: string;
}
