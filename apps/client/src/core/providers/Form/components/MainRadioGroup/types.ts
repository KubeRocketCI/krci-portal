import { GridSize } from "@mui/material";
import React from "react";
import { Control, FieldErrors, FieldPath, FieldValues, Path, UseFormRegisterReturn } from "react-hook-form";

export interface TileRadioGroupOption {
  value: string;
  label: string;
  description?: string;
  icon: React.ReactElement;
  checkedIcon: React.ReactElement;
  disabled?: boolean;
}

export interface TileRadioGroupProps<TFieldValues extends FieldValues = FieldValues>
  extends Partial<UseFormRegisterReturn<Path<TFieldValues>>> {
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  gridItemSize: GridSize;
  options: TileRadioGroupOption[];
  helperText?: string;
}
