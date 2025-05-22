import { GridSize } from "@mui/material";
import React from "react";
import { Control, FieldErrors } from "react-hook-form";

export interface MainRadioGroupOption {
  value: string;
  label: string;
  description?: string;
  icon: React.ReactElement;
  checkedIcon: React.ReactElement;
  disabled?: boolean;
}

export interface MainRadioGroupProps {
  name: string;
  control: Control<never>;
  errors: FieldErrors;
  gridItemSize: GridSize;
  options: MainRadioGroupOption[];
}
