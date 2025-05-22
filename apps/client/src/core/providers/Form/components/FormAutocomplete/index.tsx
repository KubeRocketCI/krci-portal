import { ErrorMessage } from "@hookform/error-message";
import {
  Autocomplete,
  Box,
  Checkbox,
  Chip,
  FormControl,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { Check, Info, Plus } from "lucide-react";
import React from "react";
import { Controller } from "react-hook-form";
import { SelectOption } from "@/core/providers/Form/types";
import { FormAutocompleteProps } from "./types";

export const FormAutocomplete = <T extends SelectOption>(props: FormAutocompleteProps<T>) => {
  const {
    name,
    label,
    title,
    control,
    defaultValue,
    errors,
    placeholder,
    disabled = false,
    InputProps = {},
    options,
    TextFieldProps,
    AutocompleteProps,
    ...otherProps
  } = props;

  const theme = useTheme();

  const _InputProps = React.useMemo(() => {
    return {
      ...InputProps,
      endAdornment: title && (
        <Tooltip title={title}>
          <Info />
        </Tooltip>
      ),
    };
  }, [InputProps, title]);

  const hasError = !!errors[name];

  return (
    <Stack spacing={1}>
      <FormControl fullWidth>
        <Controller
          name={name}
          control={control}
          defaultValue={defaultValue}
          render={({ field }) => {
            return (
              <Autocomplete
                {...AutocompleteProps}
                multiple
                autoComplete
                options={options}
                disabled={disabled}
                renderOption={(props, option, { selected }) => {
                  return (
                    <li {...props} style={{ height: "36px" }}>
                      <Checkbox
                        icon={<Plus />}
                        checkedIcon={<Check />}
                        style={{
                          color: selected ? theme.palette.primary.main : theme.palette.text.primary,
                        }}
                        checked={selected}
                      />
                      {option.label}
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    {...TextFieldProps}
                    InputProps={{
                      ...params.InputProps,
                      ..._InputProps,
                      endAdornment: (
                        <Stack direction="row" alignItems="center" sx={{ pt: "2px" }}>
                          {params.InputProps.endAdornment}
                          {_InputProps.endAdornment}
                        </Stack>
                      ),
                    }}
                    variant="standard"
                    label={label}
                    fullWidth
                    style={{ marginTop: 0 }}
                    placeholder={placeholder}
                  />
                )}
                renderTags={(value, getTagProps) => {
                  const numTags = value.length;
                  const limitTags = 5;

                  return (
                    <>
                      {value.slice(0, limitTags).map((option, index) => (
                        <Chip
                          {...getTagProps({ index })}
                          key={index}
                          label={option.label}
                          color="primary"
                          size="small"
                        />
                      ))}

                      <Box sx={{ mx: 1 }}>{numTags > limitTags && ` +${numTags - limitTags}`}</Box>
                    </>
                  );
                }}
                {...field}
                isOptionEqualToValue={(option, value) => option.value === value.value}
                onChange={(_e, data) => {
                  const valueArray = data.map((item) => item.value);
                  field.onChange(valueArray);
                }}
                value={field.value ? options.filter((option) => field.value.includes(option.value)) : []}
              />
            );
          }}
          {...otherProps}
        />
      </FormControl>
      {hasError && (
        <Typography component={"span"} variant={"subtitle2"} color={"error"}>
          <ErrorMessage errors={errors} name={name} />
        </Typography>
      )}
    </Stack>
  );
};
