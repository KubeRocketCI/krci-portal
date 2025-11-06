import {
  Control,
  FieldErrors,
  FieldPath,
  FieldValues,
  Path,
  RegisterOptions,
  UseFormRegisterReturn,
} from "react-hook-form";
import { SelectOption } from "../../types";
import { FormFieldProps } from "@/core/components/ui/form-field";

export interface FormSelectProps<TFieldValues extends FieldValues = FieldValues>
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

  // Select props
  options: SelectOption[];
  disabled?: boolean;
  placeholder?: string;
  
  // Adornments
  suffix?: React.ReactNode;
}
