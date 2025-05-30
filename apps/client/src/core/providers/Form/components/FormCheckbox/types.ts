import { Control, FieldErrors, FieldPath, FieldValues, Path, UseFormRegisterReturn } from "react-hook-form";
import React from "react";

export interface FormCheckboxProps<TFieldValues extends FieldValues = FieldValues>
  extends Partial<UseFormRegisterReturn<Path<TFieldValues>>> {
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  label: React.ReactElement;
  helperText?: string;
  defaultValue?: boolean;
  disabled?: boolean;
}
