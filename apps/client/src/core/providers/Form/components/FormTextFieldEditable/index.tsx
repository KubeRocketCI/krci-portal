import { FormControl, IconButton, Stack, TextField, Tooltip } from "@mui/material";
import { Edit, Info, X } from "lucide-react";
import React from "react";
import { Controller, Path, PathValue } from "react-hook-form";
import { FormTextFieldEditableProps } from "./types";

const FormTextFieldEditableInner = React.forwardRef(
  <TFormValues extends Record<string, unknown> = Record<string, unknown>>(
    {
      name,
      label,
      tooltipText,
      control,
      defaultValue = "",
      errors,
      placeholder,
      disabled = false,
      TextFieldProps = {},
      initiallyEditable = false,
      ...props
    }: FormTextFieldEditableProps<TFormValues>,
    ref: React.ForwardedRef<HTMLInputElement>
  ) => {
    const [isEditable, setIsEditable] = React.useState(initiallyEditable);

    const error = errors[name];
    const hasError = !!error;
    const errorMessage = error?.message as string;
    const helperText = hasError ? errorMessage : TextFieldProps?.helperText;

    const handleToggleEditable = () => {
      setIsEditable((prev) => !prev);
    };

    const originalInputProps = TextFieldProps.InputProps ?? {};
    const userEndAdornment = originalInputProps.endAdornment;

    const mergedInputProps = {
      ...originalInputProps,
      endAdornment: (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          {userEndAdornment}
          {tooltipText && (
            <Tooltip title={tooltipText}>
              <Info size={16} />
            </Tooltip>
          )}
          {!disabled && (
            <Tooltip title={isEditable ? "Cancel editing" : "Edit"}>
              <IconButton size="small" onClick={handleToggleEditable}>
                {isEditable ? <X size={16} /> : <Edit size={16} />}
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    };

    return (
      <Stack spacing={1}>
        <FormControl fullWidth>
          <Controller
            name={name}
            control={control}
            defaultValue={defaultValue as PathValue<TFormValues, Path<TFormValues>>}
            render={({ field }) => (
              <TextField
                {...field}
                {...TextFieldProps}
                inputRef={ref}
                placeholder={placeholder}
                disabled={disabled || !isEditable}
                error={hasError}
                label={label}
                InputProps={mergedInputProps}
                helperText={helperText}
                aria-describedby={hasError ? `${name}-error` : undefined}
                {...props}
              />
            )}
          />
        </FormControl>
      </Stack>
    );
  }
);

FormTextFieldEditableInner.displayName = "FormTextFieldEditable";

export const FormTextFieldEditable = FormTextFieldEditableInner as <
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
>(
  props: FormTextFieldEditableProps<TFormValues> & { ref?: React.ForwardedRef<HTMLInputElement> }
) => React.JSX.Element;
