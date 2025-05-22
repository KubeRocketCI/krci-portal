import { InputProps } from "@mui/material";
import { StandardTextFieldProps } from "@mui/material";
import { Control, FieldErrors } from "react-hook-form";

export interface FormTextFieldProps {
  name: string;
  control: Control<never>;
  errors: FieldErrors;
  label?: string;
  title?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  InputProps?: InputProps;
  TextFieldProps?: StandardTextFieldProps;
}
