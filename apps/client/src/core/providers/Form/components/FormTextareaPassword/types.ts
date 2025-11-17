import {
  Control,
  FieldErrors,
  FieldPath,
  FieldValues,
  Path,
  RegisterOptions,
  UseFormRegisterReturn,
} from "react-hook-form";
import { TextareaProps } from "@/core/components/ui/textarea";
import { FormFieldProps } from "@/core/components/ui/form-field";

export interface FormTextareaPasswordProps<TFieldValues extends FieldValues = FieldValues>
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

  // Textarea props
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  textareaProps?: Partial<Omit<TextareaProps, "invalid">>; // Exclude invalid as it's derived from error state
}
