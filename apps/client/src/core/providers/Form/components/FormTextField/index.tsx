import { FormControl, Stack, TextField, Tooltip } from "@mui/material";
import { InfoIcon } from "lucide-react";
import React from "react";
import { Controller } from "react-hook-form";
import { FormTextFieldProps } from "./types";

export const FormTextField = React.forwardRef<HTMLInputElement, FormTextFieldProps>(
  (
    {
      name,
      label,
      title,
      control,
      defaultValue = "",
      errors,
      placeholder,
      disabled = false,
      InputProps,
      TextFieldProps = {},
      ...props
    },
    ref
  ) => {
    const hasError = !!errors[name];

    const _InputProps = React.useMemo(() => {
      return {
        ...InputProps,
        endAdornment: title && (
          <Tooltip title={title}>
            <InfoIcon />
          </Tooltip>
        ),
      };
    }, [InputProps, title]);

    const helperText = hasError ? (errors[name]?.message as string) : TextFieldProps.helperText;

    return (
      <Stack spacing={1}>
        <FormControl fullWidth>
          <Controller
            //@ts-expect-error temporary fix
            name={name}
            control={control}
            //@ts-expect-error temporary fix
            defaultValue={defaultValue}
            render={({ field }) => (
              <TextField
                {...field}
                {...TextFieldProps}
                inputRef={ref}
                placeholder={placeholder}
                disabled={disabled}
                error={hasError}
                label={label}
                InputProps={_InputProps}
                helperText={helperText}
              />
            )}
            {...props}
          />
        </FormControl>
      </Stack>
    );
  }
);
