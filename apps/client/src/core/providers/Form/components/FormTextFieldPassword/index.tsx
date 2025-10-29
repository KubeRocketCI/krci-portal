import { FormControl, IconButton, TextField, Tooltip } from "@mui/material";
import { Eye, EyeOff, Info } from "lucide-react";
import React from "react";
import { Controller, Path, PathValue } from "react-hook-form";
import { FormTextFieldPasswordProps } from "./types";

const FormTextFieldPasswordInner = React.forwardRef(
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
      ...props
    }: FormTextFieldPasswordProps<TFormValues>,
    ref: React.ForwardedRef<HTMLInputElement>
  ) => {
    const error = errors[name];
    const hasError = !!error;
    const errorMessage = error?.message as string;
    const helperText = hasError ? errorMessage : TextFieldProps?.helperText;

    const [_type, setType] = React.useState("password");

    const handleToggleType = () => {
      setType((prev) => (prev === "text" ? "password" : "text"));
    };

    const originalInputProps = TextFieldProps.InputProps ?? {};
    const userEndAdornment = originalInputProps.endAdornment;

    const mergedInputProps = {
      ...originalInputProps,
      endAdornment: (
        <div className="flex flex-row items-center gap-1">
          {userEndAdornment}
          {tooltipText && (
            <>
              <Tooltip title={tooltipText}>
                <Info size={16} />
              </Tooltip>
              <Tooltip title="Toggle visibility">
                <div>
                  <IconButton size={"small"} onClick={handleToggleType}>
                    {_type === "text" ? <Eye size={16} /> : <EyeOff size={16} />}
                  </IconButton>
                </div>
              </Tooltip>
            </>
          )}
        </div>
      ),
      type: _type,
      autoComplete: "off",
    };

    return (
      <div className="flex flex-col gap-2">
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
                disabled={disabled}
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
      </div>
    );
  }
);

FormTextFieldPasswordInner.displayName = "FormTextFieldPassword";

export const FormTextFieldPassword = FormTextFieldPasswordInner as <
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
>(
  props: FormTextFieldPasswordProps<TFormValues> & { ref?: React.ForwardedRef<HTMLInputElement> }
) => React.JSX.Element;
