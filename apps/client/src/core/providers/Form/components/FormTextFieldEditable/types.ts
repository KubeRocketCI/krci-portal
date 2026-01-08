import {
  Control,
  FieldErrors,
  FieldPath,
  FieldValues,
  Path,
  RegisterOptions,
  UseFormRegisterReturn,
} from "react-hook-form";
import { InputProps } from "@/core/components/ui/input";
import { FormFieldProps } from "@/core/components/ui/form-field";

export interface FormTextFieldEditableProps<TFieldValues extends FieldValues = FieldValues> extends Partial<
  UseFormRegisterReturn<Path<TFieldValues>>
> {
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

  // Input props
  placeholder?: string;
  disabled?: boolean;
  inputProps?: Partial<Omit<InputProps, "invalid">>; // Exclude invalid as it's derived from error state

  // Editable props
  initiallyEditable?: boolean;
}
