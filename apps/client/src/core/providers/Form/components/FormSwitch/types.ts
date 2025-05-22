import { FormControlLabelProps } from "@mui/material";
import React from "react";
import { Control, FieldErrors } from "react-hook-form";

export interface FormSwitchProps {
  name: string;
  label: React.ReactElement;
  control: Control<never>;
  errors: FieldErrors;
  defaultValue?: boolean;
  disabled?: boolean;
  align?: React.CSSProperties["justifyContent"];
  labelPlacement?: FormControlLabelProps["labelPlacement"];
}
