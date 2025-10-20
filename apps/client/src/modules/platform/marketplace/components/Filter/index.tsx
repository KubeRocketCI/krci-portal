import { TextField, Select, SelectOption } from "@/core/components/form";
import { useFilterContext } from "@/core/providers/Filter";
import { codebaseType } from "@my-project/shared";
import { Box, Button } from "@mui/material";
import { FORM_CONTROL_LABEL_HEIGHT } from "@/core/providers/Form/constants";

const codebaseTypeOptions: SelectOption[] = [
  { label: "All", value: "all" },
  ...Object.entries(codebaseType).map(([key, value]) => ({
    label: value,
    value: key,
  })),
];

export const TemplateFilter = () => {
  const { form, reset } = useFilterContext();

  return (
    <div className="flex items-start gap-4">
      <div className="w-64">
        <form.Field
          name="search"
          listeners={{
            onChangeDebounceMs: 300,
          }}
        >
          {(field) => <TextField field={field} label="Search" placeholder="Search templates" />}
        </form.Field>
      </div>

      <div className="w-64">
        <form.Field name="codebaseType">
          {(field) => (
            <Select field={field} label="Codebase Type" options={codebaseTypeOptions} placeholder="Select type" />
          )}
        </form.Field>
      </div>

      {form.state.isDirty && (
        <Box sx={{ mt: (t) => t.typography.pxToRem(FORM_CONTROL_LABEL_HEIGHT) }}>
          <Button variant="outlined" onClick={reset} size="small">
            Clear
          </Button>
        </Box>
      )}
    </div>
  );
};
