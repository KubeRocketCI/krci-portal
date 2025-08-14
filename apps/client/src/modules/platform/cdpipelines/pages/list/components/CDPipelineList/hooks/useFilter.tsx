import { SearchControl } from "@/core/providers/Filter/components/Filter/components/SearchControl";
import { useFilterContext } from "@/core/providers/Filter/hooks";
import { FilterControls } from "@/core/providers/Filter/types";
// import { useClusterStore } from "@/k8s/store";
import { Autocomplete, FormHelperText, TextField } from "@mui/material";
import { CDPipeline } from "@my-project/shared";
import React from "react";
// import { useShallow } from "zustand/react/shallow";
import { cdPipelineFilterControlNames } from "../../../constants";
import { CDPipelineListFilterControlNames } from "../../../types";

type FilterControlsType = FilterControls<CDPipelineListFilterControlNames>;

export const useFilter = ({
  cdPipelines,
}: {
  cdPipelines: CDPipeline[];
}): {
  controls: FilterControlsType;
  filterFunction: (...args: CDPipeline[]) => boolean;
} => {
  // const allowedNamespaces = useClusterStore(useShallow((state) => state.allowedNamespaces));

  const { filter, setFilterItem, filterFunction } = useFilterContext<CDPipeline, CDPipelineListFilterControlNames>();

  const handleCodebasesChange = React.useCallback(
    (event: React.SyntheticEvent<Element, Event>, values: string[]) => {
      setFilterItem(cdPipelineFilterControlNames.CODEBASES, values);
    },
    [setFilterItem]
  );

  const cdPipelineCodebases = React.useMemo(() => {
    if (!cdPipelines) {
      return [] as string[];
    }

    return Array.from(
      cdPipelines.reduce((acc, cur) => {
        const curCdPipelineCodebases = cur.spec.applications;

        curCdPipelineCodebases.forEach((codebase) => {
          acc.add(codebase);
        });

        return acc;
      }, new Set())
    ) as string[];
  }, [cdPipelines]);

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
      // ...(allowedNamespaces.length > 1
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
      codebases: {
        gridXs: 8,
        component: (
          <Autocomplete
            multiple
            options={cdPipelineCodebases}
            freeSolo
            getOptionLabel={(option) => option}
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
    };
  }, [cdPipelineCodebases, filter.values.codebases, handleCodebasesChange]);

  return { controls, filterFunction };
};
