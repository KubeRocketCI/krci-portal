import {
  Control,
  FieldErrors,
  FieldPath,
  FieldValues,
  Path,
  RegisterOptions,
  UseFormRegisterReturn,
} from "react-hook-form";
import { ReactNode } from "react";
import { FormFieldProps } from "@/core/components/ui/form-field";

export interface FormRadioOption {
  value: string;
  label: ReactNode;
  icon?: ReactNode;
  checkedIcon?: ReactNode;
  disabled?: boolean;
  disabledTooltip?: string;
}

export interface FormRadioGroupProps<TFieldValues extends FieldValues = FieldValues>
  extends Partial<UseFormRegisterReturn<Path<TFieldValues>>> {
  // Controller props
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  rules?: RegisterOptions<TFieldValues, Path<TFieldValues>>;
  defaultValue?: string;

  // FormField props
  label?: FormFieldProps["label"];
  tooltipText?: FormFieldProps["tooltipText"];
  helperText?: FormFieldProps["helperText"];

  // RadioGroup props
  options: FormRadioOption[];
  disabled?: boolean;
  className?: string;
}
