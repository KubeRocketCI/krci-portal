import { FormControlLabelProps } from "@mui/material";
import React from "react";
import { Control, FieldErrors, FieldPath, FieldValues, Path, UseFormRegisterReturn } from "react-hook-form";

export interface FormSwitchProps<TFieldValues extends FieldValues = FieldValues>
  extends Partial<UseFormRegisterReturn<Path<TFieldValues>>> {
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  label: React.ReactElement;
  errors: FieldErrors<TFieldValues>;
  defaultValue?: boolean;
  disabled?: boolean;
  labelPlacement?: FormControlLabelProps["labelPlacement"];
}
