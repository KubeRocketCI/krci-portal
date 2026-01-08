import { Control, FieldErrors, FieldPath, FieldValues, Path, UseFormRegisterReturn } from "react-hook-form";
import React from "react";

export interface FormCheckboxProps<TFieldValues extends FieldValues = FieldValues> extends Partial<
  UseFormRegisterReturn<Path<TFieldValues>>
> {
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  label: React.ReactNode; // Changed from React.ReactElement to React.ReactNode for flexibility
  helperText?: string;
  defaultValue?: boolean;
  disabled?: boolean;
}
