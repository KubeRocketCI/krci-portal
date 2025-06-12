import { StandardTextFieldProps } from "@mui/material";
import { Control, FieldErrors, FieldPath, FieldValues, Path, UseFormRegisterReturn } from "react-hook-form";

export interface FormTextFieldPasswordProps<TFieldValues extends FieldValues = FieldValues>
  extends Partial<UseFormRegisterReturn<Path<TFieldValues>>> {
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  label?: string;
  tooltipText?: React.ReactNode;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  TextFieldProps?: StandardTextFieldProps;
}
