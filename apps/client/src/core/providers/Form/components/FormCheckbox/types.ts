import React from "react";
import { Control, FieldErrors } from "react-hook-form";

export interface FormCheckboxProps {
  name: string;
  label: React.ReactElement;
  control: Control<never>;
  errors: FieldErrors;
  defaultValue?: boolean;
  disabled?: boolean;
}
