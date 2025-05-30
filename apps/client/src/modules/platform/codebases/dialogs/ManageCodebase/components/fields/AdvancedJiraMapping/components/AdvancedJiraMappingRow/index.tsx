import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { Button, FormControl, Grid, TextField, useTheme } from "@mui/material";
import { Pencil } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { createAdvancedMappingRowName } from "../../constants";
import { AdvancedJiraMappingRowProps } from "./types";

export const AdvancedJiraMappingRow = ({
  label,
  value,
  handleDeleteMappingRow,
  onChangeJiraPattern,
}: AdvancedJiraMappingRowProps) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  const theme = useTheme();

  return (
    <Grid item xs={12}>
      <Grid container spacing={2}>
        <Grid item xs={5}>
          <TextField disabled value={label} fullWidth />
        </Grid>
        <Grid item xs={5}>
          <FormControl fullWidth>
            <FormTextField
              {...register(createAdvancedMappingRowName(value), {
                required: "Add at least one variable.",
                onBlur: (event) => onChangeJiraPattern(event, value),
              })}
              placeholder={`Enter Jira pattern`}
              control={control}
              errors={errors}
            />
          </FormControl>
        </Grid>
        <Grid
          item
          xs={2}
          direction={"column"}
          justifyContent={"flex-end"}
          alignItems={"center"}
          style={{ display: "flex" }}
        >
          <Button
            type={"button"}
            size={"small"}
            component={"button"}
            style={{ minWidth: 0 }}
            onClick={() => handleDeleteMappingRow(value)}
          >
            <Pencil size={20} color={theme.palette.grey["500"]} />
          </Button>
        </Grid>
      </Grid>
    </Grid>
  );
};
