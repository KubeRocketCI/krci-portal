import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { Input } from "@/core/components/ui/input";
import { Button } from "@/core/components/ui/button";
import { Trash2 } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { AdvancedJiraMappingRowProps } from "./types";
import { CREATE_WIZARD_NAMES } from "../../../names";

export const AdvancedJiraMappingRow = ({ label, index, onDelete, onPatternChange }: AdvancedJiraMappingRowProps) => {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="grow">
          <Input disabled value={label} className="w-full" />
        </div>
        <div className="grow">
          <FormTextField
            name={`${CREATE_WIZARD_NAMES.ui_advancedMappingRows}.${index}.pattern` as const}
            control={control}
            errors={errors}
            placeholder={`Enter Jira pattern`}
            rules={{
              required: "Add at least one variable.",
            }}
            inputProps={{
              onBlur: onPatternChange,
            }}
          />
        </div>
        <div className="shrink">
          <Button type={"button"} size={"sm"} variant="ghost" className="min-w-0" onClick={() => onDelete(index)}>
            <Trash2 size={20} className="text-muted-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );
};
