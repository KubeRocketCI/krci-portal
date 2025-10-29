import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { Button, FormControl, TextField, useTheme } from "@mui/material";
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
    <div>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5">
          <TextField disabled value={label} fullWidth />
        </div>
        <div className="col-span-5">
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
        </div>
        <div className="col-span-2 flex flex-col justify-end items-center">
          <Button
            type={"button"}
            size={"small"}
            component={"button"}
            style={{ minWidth: 0 }}
            onClick={() => handleDeleteMappingRow(value)}
          >
            <Pencil size={20} color={theme.palette.grey["500"]} />
          </Button>
        </div>
      </div>
    </div>
  );
};
