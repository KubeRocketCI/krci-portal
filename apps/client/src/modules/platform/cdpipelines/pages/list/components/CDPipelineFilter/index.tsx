import { useCDPipelineWatchList } from "@/k8s/api/groups/KRCI/CDPipeline";
import { useCDPipelineFilter } from "./hooks/useCDPipelineFilter";
import { Autocomplete, TextField } from "@/core/components/form";
import { Button } from "@mui/material";
import React from "react";

export const CDPipelineFilter = () => {
  const { form, reset } = useCDPipelineFilter();

  const cdPipelineListWatch = useCDPipelineWatchList();

  const cdPipelineCodebases = React.useMemo(() => {
    const list = cdPipelineListWatch.dataArray ?? [];
    return Array.from(
      list.reduce((acc, cur) => {
        cur?.spec?.applications?.forEach((codebase) => acc.add(codebase));
        return acc;
      }, new Set<string>())
    );
  }, [cdPipelineListWatch.dataArray]);

  return (
    <div>
      <div className="flex items-start gap-4">
        <div className="w-64">
          <form.Field name="search" listeners={{ onChangeDebounceMs: 300 }}>
            {(field) => <TextField field={field} label="Search" placeholder="Search CD Pipelines" />}
          </form.Field>
        </div>

        <div className="w-[560px]">
          <form.Field name="codebases">
            {(field) => (
              <Autocomplete
                field={field}
                multiple
                options={cdPipelineCodebases}
                freeSolo
                label="Codebases"
                placeholder="Select codebases"
                ChipProps={{ size: "small", color: "primary" }}
              />
            )}
          </form.Field>
        </div>

        {form.state.isDirty && (
          <div className="mt-4">
            <Button variant="outlined" onClick={reset} size="small">
              Clear
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
