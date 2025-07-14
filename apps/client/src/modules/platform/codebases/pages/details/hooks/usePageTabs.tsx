import { Box } from "@mui/material";
import React from "react";
import { BranchList } from "../components/BranchList";
import { Overview } from "../components/Overview";

export const usePageTabs = () => {
  return React.useMemo(() => {
    return [
      {
        label: "Overview",
        id: "overview",
        component: (
          <Box sx={{ mt: (t) => t.typography.pxToRem(24) }}>
            <Overview />
          </Box>
        ),
      },
      {
        label: "Branches",
        id: "branches",
        component: (
          <Box sx={{ mt: (t) => t.typography.pxToRem(24) }}>
            <BranchList />
          </Box>
        ),
      },
    ];
  }, []);
};
