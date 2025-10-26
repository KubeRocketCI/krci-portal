import { Autocomplete, NamespaceAutocomplete, Select } from "@/core/components/form";
import { FORM_CONTROL_LABEL_HEIGHT } from "@/core/providers/Form/constants";
import { ValueOf } from "@/core/types/global";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { FilterTypeWithOptionAll } from "@/k8s/types";
import { Box, Button, FormHelperText, Stack } from "@mui/material";
import { PipelineRun, pipelineRunLabels, pipelineRunStatus, PipelineType } from "@my-project/shared";
import React from "react";
import { pipelineRunFilterControlNames } from "./constants";
import { usePipelineRunFilter } from "./hooks/usePipelineRunFilter";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";

export const PipelineRunFilter = ({
  pipelineRuns,
  pipelineRunTypes,
  filterControls,
}: {
  pipelineRuns: PipelineRun[];
  pipelineRunTypes: FilterTypeWithOptionAll<PipelineType>[];
  filterControls: ValueOf<typeof pipelineRunFilterControlNames>[];
}) => {
  const { form, reset } = usePipelineRunFilter();

  const codebaseOptions = React.useMemo(() => {
    const set = new Set(
      pipelineRuns?.map(({ metadata: { labels } }) => labels?.[pipelineRunLabels.codebase]).filter(Boolean)
    );

    return Array.from(set);
  }, [pipelineRuns]);

  const allowedNamespaces = useClusterStore(useShallow((state) => state.allowedNamespaces));
  const showNamespaceFilter = allowedNamespaces.length > 1;

  const namespaceOptions = React.useMemo(() => allowedNamespaces, [allowedNamespaces]);

  const pipelineTypeOptions = React.useMemo(
    () => [
      { label: "All", value: "all" },
      ...pipelineRunTypes.map((value) => ({ label: capitalizeFirstLetter(value), value })),
    ],
    [pipelineRunTypes]
  );

  const statusOptions = React.useMemo(
    () => [
      { label: "All", value: "all" },
      ...Object.values(pipelineRunStatus).map((v) => ({ label: capitalizeFirstLetter(v), value: v })),
    ],
    []
  );

  return (
    <Stack direction="row" spacing={2} alignItems="flex-start">
      {filterControls.includes(pipelineRunFilterControlNames.PIPELINE_TYPE) && (
        <Box sx={{ width: (t) => t.typography.pxToRem(256) }}>
          <form.Field name="pipelineType">
            {(field) => <Select field={field} label="Type" options={pipelineTypeOptions} placeholder="Select type" />}
          </form.Field>
          <FormHelperText>
            {pipelineRunTypes.slice(0, 5).map(capitalizeFirstLetter).join(" / ")}
            {pipelineRunTypes.length > 5 ? "..." : ""}
          </FormHelperText>
        </Box>
      )}

      {filterControls.includes(pipelineRunFilterControlNames.STATUS) && (
        <Box sx={{ width: (t) => t.typography.pxToRem(256) }}>
          <form.Field name="status">
            {(field) => <Select field={field} label="Status" options={statusOptions} placeholder="Select status" />}
          </form.Field>
          <FormHelperText>Success / Failure / Unknown</FormHelperText>
        </Box>
      )}

      {filterControls.includes(pipelineRunFilterControlNames.CODEBASES) && (
        <Box sx={{ width: (t) => t.typography.pxToRem(480) }}>
          <form.Field name="codebases">
            {(field) => (
              <Autocomplete
                field={field}
                label="Codebases"
                placeholder="Select codebases"
                options={codebaseOptions}
                multiple
                freeSolo
                ChipProps={{ size: "small", color: "primary" }}
              />
            )}
          </form.Field>
        </Box>
      )}

      {showNamespaceFilter && filterControls.includes(pipelineRunFilterControlNames.NAMESPACES) && (
        <Box sx={{ width: (t) => t.typography.pxToRem(400) }}>
          <form.Field name="namespaces">
            {(field) => (
              <NamespaceAutocomplete
                field={field}
                options={namespaceOptions}
                label="Namespaces"
                placeholder="Select namespaces"
              />
            )}
          </form.Field>
        </Box>
      )}

      {form.state.isDirty && (
        <Box>
          <Box sx={{ mt: (t) => t.typography.pxToRem(FORM_CONTROL_LABEL_HEIGHT) }}>
            <Button variant="outlined" onClick={reset} size="small">
              Clear
            </Button>
          </Box>
        </Box>
      )}
    </Stack>
  );
};
