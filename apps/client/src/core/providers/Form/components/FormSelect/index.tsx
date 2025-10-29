import {
  FormControl,
  FormHelperText,
  InputLabel,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Tooltip,
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
              <div className="flex gap-4 flex-row items-center">
                <ListItemIcon sx={{ minWidth: 0 }}>{foundOptionByName.icon}</ListItemIcon>
                <ListItemText sx={{ m: 0 }}>{foundOptionByName.label}</ListItemText>
              </div>
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
                  <div
                    className="absolute top-1/2 right-6 leading-none"
                    style={{ transform: "translateY(-50%)" }}
                  >
                    <div className="flex flex-row items-center gap-1">
                      {tooltipText && (
                        <Tooltip title={tooltipText}>
                          <Info size={16} />
                        </Tooltip>
                      )}
                      {endAdornment}
                    </div>
                  </div>
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
