import { Button, Grid, Tooltip } from "@mui/material";
import React from "react";
import { useFilterContext } from "../../hooks";
import { FilterControl } from "../../types";
import { FilterProps } from "../../types";
import { FORM_CONTROL_LABEL_HEIGHT } from "@/core/providers/Form/constants";

export const Filter = <ControlNames extends string>({ controls, hideFilter = true }: FilterProps<ControlNames>) => {
  const { filter, resetFilter } = useFilterContext<unknown, ControlNames>();

  const controlsRenderer = React.useCallback(() => {
    return Object.entries(controls).map(([controlKey, controlValue]) => {
      const { component, gridXs = 3 } = controlValue as FilterControl;

      return (
        <Grid item xs={gridXs} key={controlKey}>
          {component}
        </Grid>
      );
    });
  }, [controls]);

  const hasValues = React.useMemo(() => {
    const values = Object.values(filter.values);
    if (values.length === 0) {
      return false;
    }

    return values.some((value) => {
      if (Array.isArray(value)) {
        return !!value.length;
      }
      return !!value;
    });
  }, [filter]);

  const resetFilters = () => {
    resetFilter();
  };

  return (
    <Grid container spacing={2} wrap="nowrap">
      {hideFilter ? (
        <>
          {controlsRenderer()}
          <Grid
            item
            sx={{
              mt: (t) => t.typography.pxToRem(FORM_CONTROL_LABEL_HEIGHT),
              visibility: hasValues ? "visible" : "hidden",
              pointerEvents: hasValues ? "auto" : "none",
            }}
          >
            <Tooltip title={"Reset Filter"}>
              <Button variant="outlined" onClick={resetFilters} size="small">
                Clear
              </Button>
            </Tooltip>
          </Grid>
        </>
      ) : (
        controlsRenderer()
      )}
    </Grid>
  );
};
