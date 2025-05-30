import {
  Box,
  FormControl,
  FormHelperText,
  InputLabel,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  useTheme,
} from "@mui/material";
import clsx from "clsx";
import React from "react";
import { Controller, Path, PathValue } from "react-hook-form";
import { useStyles } from "./styles";
import { FormSelectProps } from "./types";
import { Info } from "lucide-react";

const FormSelectInner = React.forwardRef(
  <TFormValues extends Record<string, unknown> = Record<string, unknown>>(
    {
      name,
      label,
      tooltipText,
      control,
      defaultValue = "",
      errors,
      options = [],
      disabled = false,
      endAdornment,
      helperText,
      ...props
    }: FormSelectProps<TFormValues>,
    ref: React.ForwardedRef<HTMLInputElement>
  ) => {
    const theme = useTheme();
    const classes = useStyles();
    const error = errors[name];
    const hasError = !!error;
    const errorMessage = error?.message as string;
    const _helperText = hasError ? errorMessage : helperText;

    const getOptionValue = React.useCallback(
      (optionValue: string) => {
        if (options.length) {
          const [foundOptionByName] = options.filter(({ value }) => value === optionValue);
          if (foundOptionByName) {
            return foundOptionByName.icon ? (
              <Stack spacing={2} direction="row" alignItems="center">
                <ListItemIcon sx={{ minWidth: 0 }}>{foundOptionByName.icon}</ListItemIcon>
                <ListItemText>{foundOptionByName.label}</ListItemText>
              </Stack>
            ) : (
              foundOptionByName.label
            );
          }
        }
        return defaultValue;
      },
      [defaultValue, options]
    );

    return (
      <FormControl fullWidth>
        <InputLabel>{label}</InputLabel>
        <Controller
          render={({ field }) => {
            return (
              <Select
                {...field}
                inputRef={ref}
                error={hasError}
                displayEmpty
                disabled={disabled}
                fullWidth
                renderValue={(value) => (value !== "" ? getOptionValue(value as string) : label)}
                className={clsx({
                  [classes.selectWithDefaultValue]: field.value === "",
                })}
                endAdornment={
                  <Box
                    sx={{
                      position: "absolute",
                      top: "50%",
                      transform: "translateY(-50%)",
                      right: theme.typography.pxToRem(24),
                      lineHeight: 0,
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      {endAdornment}
                      {tooltipText && (
                        <Tooltip title={tooltipText}>
                          <Info size={16} />
                        </Tooltip>
                      )}
                    </Stack>
                  </Box>
                }
              >
                {options.map(({ label, value, disabled = false, icon }, idx) => {
                  const key = `${label}::${idx}`;

                  return (
                    <MenuItem value={value} key={key} disabled={disabled}>
                      {icon && <ListItemIcon>{icon}</ListItemIcon>}
                      <ListItemText>{label}</ListItemText>
                    </MenuItem>
                  );
                })}
              </Select>
            );
          }}
          name={name}
          defaultValue={defaultValue as PathValue<TFormValues, Path<TFormValues>>}
          control={control}
          {...props}
        />
        {_helperText && <FormHelperText error={hasError}>{_helperText}</FormHelperText>}
      </FormControl>
    );
  }
);

FormSelectInner.displayName = "FormSelect";

export const FormSelect = FormSelectInner as <TFormValues extends Record<string, unknown> = Record<string, unknown>>(
  props: FormSelectProps<TFormValues> & { ref?: React.ForwardedRef<HTMLInputElement> }
) => React.JSX.Element;
