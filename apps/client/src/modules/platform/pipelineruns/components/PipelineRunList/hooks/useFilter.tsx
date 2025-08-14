import { Autocomplete, FormHelperText, ListItemText, MenuItem, Select, TextField, Tooltip } from "@mui/material";
import React from "react";
import { pipelineRunFilterControlNames } from "../constants";
import { FORM_CONTROL_LABEL_HEIGHT } from "@/core/providers/Form/constants";
import { capitalizeFirstLetter } from "@/core/utils/format/capitalizeFirstLetter";
import { PipelineRun, pipelineRunLabels, pipelineRunStatus, PipelineType } from "@my-project/shared";
import { useFilterContext } from "@/core/providers/Filter/hooks";
import { FieldEvent } from "@/core/types/forms";
import { SearchControl } from "@/core/providers/Filter/components/Filter/components/SearchControl";
import { mapArrayToSelectOptions } from "@/core/utils/forms/mapToSelectOptions";

type FilterControlsType = FilterControls<PipelineRunFilterAllControlNames>;

export const useFilter = ({
  pipelineRuns,
  pipelineRunTypes,
  filterControls,
}: {
  pipelineRuns: PipelineRun[];
  pipelineRunTypes: PipelineType[];
  filterControls: PipelineRunFilterAllControlNames[];
}): {
  controls: FilterControlsType;
  filterFunction: (...args: PipelineRun[]) => boolean;
} => {
  const pipelineCodebases = React.useMemo(() => {
    return new Set(
      pipelineRuns?.map(({ metadata: { labels } }) => labels?.[pipelineRunLabels.codebase]).filter(Boolean)
    );
  }, [pipelineRuns]);

  const { filter, setFilterItem, filterFunction } = useFilterContext<PipelineRun, PipelineRunFilterAllControlNames>();

  const handleCodebasesChange = React.useCallback(
    (event: React.SyntheticEvent<Element, Event>, values: (string | undefined)[]) => {
      setFilterItem(pipelineRunFilterControlNames.CODEBASES, values);
    },
    [setFilterItem]
  );

  const handleStatusChange = React.useCallback(
    ({ target: { value } }: FieldEvent) => {
      setFilterItem(pipelineRunFilterControlNames.STATUS, value);
    },
    [setFilterItem]
  );

  const handleTypeChange = React.useCallback(
    ({ target: { value } }: FieldEvent) => {
      setFilterItem(pipelineRunFilterControlNames.PIPELINE_TYPE, value);
    },
    [setFilterItem]
  );

  const allPipelineTypes = pipelineRunTypes.map((el) => capitalizeFirstLetter(el)).join(" / ");

  const pipelineTypeSelectHelperText = allPipelineTypes.split(" / ").slice(0, 5).join(" / ").concat("...");

  const controls: FilterControlsType = React.useMemo(() => {
    return {
      search: {
        component: (
          <div>
            <SearchControl />
            <FormHelperText> </FormHelperText>
          </div>
        ),
      },
      // ...((getClusterSettings()?.allowedNamespaces || []).length > 1
      //   ? {
      //       namespace: {
      //         component: (
      //           <div>
      //             <NamespaceControl />
      //             <FormHelperText> </FormHelperText>
      //           </div>
      //         ),
      //       },
      //     }
      //   : {}),
      ...(filterControls.includes(pipelineRunFilterControlNames.PIPELINE_TYPE)
        ? {
            pipelineType: {
              gridXs: 2,
              component: (
                <>
                  <Select
                    onChange={handleTypeChange}
                    name="type"
                    value={(filter.values.pipelineType as string) ?? "all"}
                    label={"Type"}
                    fullWidth
                    sx={{
                      height: (t) => t.typography.pxToRem(32),
                      mt: (t) => t.typography.pxToRem(FORM_CONTROL_LABEL_HEIGHT),
                    }}
                  >
                    {pipelineRunTypes.map((value) => (
                      <MenuItem value={value} key={value}>
                        <ListItemText>{capitalizeFirstLetter(value)}</ListItemText>
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    <Tooltip title={allPipelineTypes}>
                      <span>{pipelineTypeSelectHelperText}</span>
                    </Tooltip>
                  </FormHelperText>
                </>
              ),
            },
          }
        : {}),
      ...(filterControls.includes(pipelineRunFilterControlNames.STATUS)
        ? {
            status: {
              gridXs: 2,
              component: (
                <>
                  <Select
                    onChange={handleStatusChange}
                    name="status"
                    value={(filter.values.status as string) ?? "all"}
                    label={"Status"}
                    fullWidth
                    sx={{
                      height: (t) => t.typography.pxToRem(32),
                      mt: (t) => t.typography.pxToRem(FORM_CONTROL_LABEL_HEIGHT),
                    }}
                  >
                    {[
                      {
                        label: "all",
                        value: "all",
                      },
                      ...mapArrayToSelectOptions(Object.values(pipelineRunStatus)),
                    ].map((value) => (
                      <MenuItem value={value.value} key={value.value}>
                        <ListItemText>{capitalizeFirstLetter(value.value)}</ListItemText>
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Success / Failure / Unknown</FormHelperText>
                </>
              ),
            },
          }
        : {}),
      ...(filterControls.includes(pipelineRunFilterControlNames.CODEBASES)
        ? {
            codebases: {
              gridXs: 6,
              component: (
                <Autocomplete
                  multiple
                  options={
                    pipelineCodebases
                      ? Array.from(pipelineCodebases)
                          .map((el) => el)
                          .filter(Boolean)
                      : []
                  }
                  freeSolo
                  getOptionLabel={(option) => option!}
                  onChange={handleCodebasesChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Codebases"
                      placeholder="Select codebases"
                      helperText="Applications, libraries, autotests and infrastructures pipelines."
                    />
                  )}
                  value={(filter.values.codebases as string[]) ?? []}
                  ChipProps={{
                    size: "small",
                    color: "primary",
                  }}
                />
              ),
            },
          }
        : {}),
    };
  }, [
    filterControls,
    handleTypeChange,
    filter.values.pipelineType,
    filter.values.status,
    filter.values.codebases,
    pipelineRunTypes,
    allPipelineTypes,
    pipelineTypeSelectHelperText,
    handleStatusChange,
    pipelineCodebases,
    handleCodebasesChange,
  ]);

  return { controls, filterFunction };
};
