import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { Input } from "@/core/components/ui/input";
import { Button } from "@/core/components/ui/button";
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
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <div>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5">
          <Input disabled value={label} className="w-full" />
        </div>
        <div className="col-span-5">
          <FormTextField
            name={createAdvancedMappingRowName(value)}
            control={control}
            errors={errors}
            placeholder={`Enter Jira pattern`}
            rules={{
              required: "Add at least one variable.",
            }}
            inputProps={{
              onBlur: (event) => onChangeJiraPattern(event, value),
            }}
          />
        </div>
        <div className="col-span-2 flex flex-col items-center justify-end">
          <Button
            type={"button"}
            size={"sm"}
            variant="ghost"
            className="min-w-0"
            onClick={() => handleDeleteMappingRow(value)}
          >
            <Pencil size={20} className="text-muted-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );
};
